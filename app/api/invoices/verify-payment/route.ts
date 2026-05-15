import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';
import { requireAuthSession } from '@/lib/api/require-auth';
import { recomputeJobRevenue } from '@/lib/jobs/revenue';
import {
  JobStatus,
  FinancialEntityType,
  FinancialEventSource,
  FinancialEventType,
} from '@prisma/client';
import { createFinancialEventSafe } from '@/lib/financial-events/events';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-06-30.basil',
});

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
    const invoiceId = paymentIntent.metadata?.invoiceId;

    if (invoiceId) {
      const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId },
      });
      if (!invoice || invoice.userId !== session.user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      if (paymentIntent.status === 'succeeded') {
        const updated = await prisma.invoice.update({
          where: { id: invoice.id },
          data: { status: 'paid' },
        });
        await createFinancialEventSafe({
          userId: session.user.id,
          type: FinancialEventType.INVOICE_STATUS_CHANGED,
          source: FinancialEventSource.API_INVOICES,
          amount: updated.amount,
          relatedEntityType: FinancialEntityType.INVOICE,
          relatedEntityId: updated.id,
          metadata: {
            invoiceId: updated.id,
            status: updated.status,
            paymentIntentStatus: paymentIntent.status,
          },
        });
        if (updated.jobId) {
          await recomputeJobRevenue(updated.jobId, session.user.id);
          const pendingCount = await prisma.invoice.count({
            where: { jobId: updated.jobId, userId: session.user.id, status: { not: 'paid' } },
          });
          await prisma.job.update({
            where: { id: updated.jobId },
            data: { status: pendingCount === 0 ? JobStatus.PAID : JobStatus.AWAITING_PAYMENT },
          });
        }
      } else if (
        paymentIntent.status === 'requires_payment_method' ||
        paymentIntent.status === 'canceled'
      ) {
        const updated = await prisma.invoice.update({
          where: { id: invoice.id },
          data: { status: 'failed' },
        });
        await createFinancialEventSafe({
          userId: session.user.id,
          type: FinancialEventType.INVOICE_STATUS_CHANGED,
          source: FinancialEventSource.API_INVOICES,
          amount: updated.amount,
          relatedEntityType: FinancialEntityType.INVOICE,
          relatedEntityId: updated.id,
          metadata: {
            invoiceId: updated.id,
            status: updated.status,
            paymentIntentStatus: paymentIntent.status,
          },
        });
        if (updated.jobId) {
          await recomputeJobRevenue(updated.jobId, session.user.id);
          await prisma.job.update({
            where: { id: updated.jobId },
            data: { status: JobStatus.AWAITING_PAYMENT },
          });
        }
      }
    }

    return NextResponse.json({
      status: paymentIntent.status,
      invoiceId: paymentIntent.metadata?.invoiceId ?? null,
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
