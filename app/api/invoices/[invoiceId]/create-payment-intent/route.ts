import { NextResponse } from 'next/server';
import type { Invoice } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { findOwnedFirst } from '@/lib/db/owned';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-06-30.basil',
});

type Ctx = { params: Promise<{ invoiceId: string }> };

/**
 * Stripe PaymentIntent for embedded card flows. Returns client_secret only.
 */
export async function POST(_request: Request, context: Ctx) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { invoiceId } = await context.params;

    const invoice = await findOwnedFirst<Invoice>(prisma.invoice, invoiceId, session.user.id);

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(invoice.amount * 100),
      currency: 'usd',
      metadata: {
        invoiceId: invoice.id,
        jobId: invoice.jobId ?? '',
        quoteId: invoice.quoteId ?? '',
        userId: session.user.id,
      },
      automatic_payment_methods: { enabled: true },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
