import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { sessionId, successUrl, cancelUrl } = body;

    // Get the mentor session
    const mentorSession = await prisma.mentorSession.findUnique({
      where: { id: sessionId },
      include: {
        mentor: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
        user: {
          select: {
            name: true,
            email: true,
            stripeCustomerId: true,
          },
        },
      },
    });

    if (!mentorSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (mentorSession.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get or create Stripe customer
    let customerId = mentorSession.user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: mentorSession.user.email!,
        name: mentorSession.user.name!,
        metadata: {
          userId: session.user.id,
        },
      });

      await prisma.user.update({
        where: { id: session.user.id },
        data: { stripeCustomerId: customer.id },
      });

      customerId = customer.id;
    }

    // Create Stripe checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${mentorSession.mentor.name} - ${mentorSession.sessionType === 'STACKZEN_SESSION' ? 'StackZen Session' : 'Direct Booking'}`,
              description: `${mentorSession.duration} minute session on ${new Date(mentorSession.scheduledAt).toLocaleDateString()}`,
            },
            unit_amount: Math.round(mentorSession.price * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url:
        successUrl || `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/mentors?success=true`,
      cancel_url: cancelUrl || `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/mentors?canceled=true`,
      metadata: {
        sessionId: mentorSession.id,
        mentorId: mentorSession.mentorId,
        userId: session.user.id,
        sessionType: mentorSession.sessionType,
      },
    });

    // Update session with Stripe session ID
    await prisma.mentorSession.update({
      where: { id: sessionId },
      data: { stripeSessionId: checkoutSession.id },
    });

    return NextResponse.json({
      sessionId: checkoutSession.id,
      url: checkoutSession.url,
    });
  } catch (error) {
    console.error('Error creating payment session:', error);
    return NextResponse.json({ error: 'Failed to create payment session' }, { status: 500 });
  }
}
