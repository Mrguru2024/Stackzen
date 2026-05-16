import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';
import { requireAuthSession } from '@/lib/api/require-auth';
import { enforceApiRateLimit } from '@/lib/api/rate-limit-request';
import { getURL } from '@/lib/utils';

const bodySchema = z
  .object({
    invoiceId: z.string().cuid(),
    amount: z.number().positive().finite(),
    clientEmail: z.string().email().max(320).optional(),
  })
  .strict();

function stripeClient(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY is not configured');
  }
  return new Stripe(key, { apiVersion: '2025-06-30.basil' });
}

/**
 * Creates a Stripe Checkout Session for an invoice payment.
 * Returns only the public session URL (never the secret key).
 */
export async function POST(req: Request) {
  const limited = await enforceApiRateLimit(req, 'invoice_payment_session');
  if (limited) return limited;

  const { session, response } = await requireAuthSession();
  if (response) return response;

  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const { invoiceId, amount, clientEmail } = parsed.data;

    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, userId: session.user.id },
      include: { client: true },
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const stripe = stripeClient();
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Invoice #${invoice.number}`,
              description: `Payment for invoice #${invoice.number}`,
            },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${getURL()}invoices/${invoiceId}?payment=success`,
      cancel_url: `${getURL()}invoices/${invoiceId}?payment=cancelled`,
      customer_email: clientEmail || invoice.client.email || undefined,
      metadata: {
        invoiceId,
        jobId: invoice.jobId ?? '',
        quoteId: invoice.quoteId ?? '',
        userId: session.user.id,
      },
    });

    return NextResponse.json({ sessionUrl: checkoutSession.url });
  } catch {
    console.error('[invoice create-payment-intent] failed');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
