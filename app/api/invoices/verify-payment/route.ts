import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';
import { requireAuthSession } from '@/lib/api/require-auth';
import type { Invoice } from '@prisma/client';
import { findOwnedFirst } from '@/lib/db/owned';
import { logSafeError } from '@/lib/security/safe-log';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-06-30.basil',
});

/**
 * **Non-authoritative** payment status poll for the client UI.
 *
 * Invoice `paid` / `failed` transitions are applied only by the Stripe webhook
 * (`app/api/webhooks/stripe/route.ts`). This route never mutates invoice rows.
 */
export async function GET(request: Request) {
  try {
    const { session, response } = await requireAuthSession();
    if (response) return response;

    const { searchParams } = new URL(request.url);
    const paymentIntentId = searchParams.get('payment_intent');

    if (!paymentIntentId) {
      return NextResponse.json(
        { error: 'payment_intent query parameter is required' },
        { status: 400 }
      );
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    const invoiceId = paymentIntent.metadata?.invoiceId ?? null;

    let invoiceStatus: string | null = null;
    if (invoiceId) {
      const invoice = await findOwnedFirst<Invoice>(prisma.invoice, invoiceId, session.user.id, {
        select: { status: true },
      });
      if (!invoice) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      invoiceStatus = (invoice as { status: string }).status;
    }

    return NextResponse.json({
      authoritative: false,
      message:
        'Payment confirmation is finalized by Stripe webhooks. Poll this endpoint for UI hints only.',
      paymentIntentStatus: paymentIntent.status,
      invoiceId,
      invoiceStatus,
    });
  } catch (error) {
    logSafeError('INVOICE_VERIFY_PAYMENT', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
