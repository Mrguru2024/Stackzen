import { NextRequest, NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { getStripe } from '@/lib/stripe/client';
import { prisma } from '@/lib/prisma';
import { requireAuthSession } from '@/lib/api/require-auth';
import { getURL } from '@/lib/utils';
import { mentorCanReceiveSessionPayouts } from '@/lib/stripe/mentor-connect';

export async function POST(request: NextRequest) {
  try {
    const { session, response } = await requireAuthSession();
    if (response) return response;

    const body = await request.json();
    const { sessionId, successUrl, cancelUrl } = body as {
      sessionId?: string;
      successUrl?: string;
      cancelUrl?: string;
    };

    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId required' }, { status: 400 });
    }

    const mentorSession = await prisma.mentorSession.findUnique({
      where: { id: sessionId },
      include: {
        mentor: { select: { id: true, name: true, stripeConnectId: true } },
        user: { select: { name: true, email: true, stripeCustomerId: true } },
      },
    });

    if (!mentorSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (mentorSession.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (mentorSession.stripeSessionId) {
      const existing = await getStripe().checkout.sessions.retrieve(mentorSession.stripeSessionId);
      if (existing.url && existing.status === 'open') {
        return NextResponse.json({ sessionId: existing.id, url: existing.url });
      }
    }

    let customerId = mentorSession.user.stripeCustomerId;
    if (!customerId && mentorSession.user.email) {
      const customer = await getStripe().customers.create({
        email: mentorSession.user.email,
        name: mentorSession.user.name ?? undefined,
        metadata: { userId: session.user.id },
      });
      customerId = customer.id;
      await prisma.user.update({
        where: { id: session.user.id },
        data: { stripeCustomerId: customer.id },
      });
    }

    const base = getURL();
    const productName =
      mentorSession.sessionType === 'STACKZEN_SESSION'
        ? `StackZen session with ${mentorSession.mentor.name}`
        : `Mentor session with ${mentorSession.mentor.name}`;

    const payout = await mentorCanReceiveSessionPayouts(mentorSession.mentorId);
    const platformFeeCents = Math.round(mentorSession.platformFee * 100);
    const totalCents = Math.round(mentorSession.price * 100);

    const checkoutParams: Stripe.Checkout.SessionCreateParams = {
      customer: customerId ?? undefined,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: productName,
              description: `${mentorSession.duration} min · ${new Date(mentorSession.scheduledAt).toLocaleDateString()}`,
            },
            unit_amount: totalCents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url:
        successUrl ?? `${base}mentors/booking/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl ?? `${base}mentors/booking/cancel?mentor_session_id=${mentorSession.id}`,
      metadata: {
        mentorSessionId: mentorSession.id,
        mentorId: mentorSession.mentorId,
        userId: session.user.id,
        sessionType: mentorSession.sessionType,
        kind: 'mentor_session_payment',
      },
    };

    if (payout.ok && payout.accountId) {
      checkoutParams.payment_intent_data = {
        application_fee_amount: platformFeeCents,
        transfer_data: { destination: payout.accountId },
      };
    }

    const checkoutSession = await getStripe().checkout.sessions.create(checkoutParams);

    await prisma.mentorSession.update({
      where: { id: sessionId },
      data: { stripeSessionId: checkoutSession.id },
    });

    return NextResponse.json({
      sessionId: checkoutSession.id,
      url: checkoutSession.url,
      payoutSplit: payout.ok,
    });
  } catch (error) {
    console.error('Error creating mentor payment session:', error);
    return NextResponse.json({ error: 'Failed to create payment session' }, { status: 500 });
  }
}
