import { NextResponse } from 'next/server';
import { requireAuthSession } from '@/lib/api/require-auth';
import { enforceApiRateLimit } from '@/lib/api/rate-limit-request';
import { createPayableStripeInvoice } from '@/lib/stripe/invoices';
import { prisma } from '@/lib/prisma';

type Ctx = { params: Promise<{ invoiceId: string }> };

/**
 * Generates (or returns the existing) Stripe-hosted payment URL for an
 * invoice. This is the one-click "Get Paid" action surfaced in the UI.
 *
 * Idempotent: re-calling for the same invoice returns the same hosted URL,
 * so the user can safely click multiple times or re-load the page.
 */
export async function POST(req: Request, context: Ctx) {
  const limited = await enforceApiRateLimit(req, 'invoice_payment_link');
  if (limited) return limited;

  const { session, response } = await requireAuthSession();
  if (response) return response;

  try {
    const { invoiceId } = await context.params;
    const result = await createPayableStripeInvoice({ userId: session.user.id, invoiceId });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to create payment link';
    console.error('[invoice_payment_link]', error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function GET(_req: Request, context: Ctx) {
  const { session, response } = await requireAuthSession();
  if (response) return response;

  const { invoiceId } = await context.params;
  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, userId: session.user.id },
    select: {
      id: true,
      stripeInvoiceId: true,
      stripeHostedInvoiceUrl: true,
      stripeInvoicePdfUrl: true,
      paymentEnabled: true,
      status: true,
    },
  });

  if (!invoice) {
    return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
  }

  return NextResponse.json({
    invoiceId: invoice.id,
    paymentEnabled: invoice.paymentEnabled,
    hostedInvoiceUrl: invoice.stripeHostedInvoiceUrl,
    invoicePdfUrl: invoice.stripeInvoicePdfUrl,
    stripeInvoiceId: invoice.stripeInvoiceId,
    status: invoice.status,
  });
}
