import 'server-only';
import type Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import { getStripe } from './client';

export type PayableInvoiceResult = {
  invoiceId: string;
  hostedInvoiceUrl: string;
  invoicePdfUrl: string | null;
  stripeInvoiceId: string;
};

/**
 * The platform fee charged on top of the invoice amount that flows to the
 * connected account. Kept in one place so finance can change it without
 * hunting through the codebase.
 */
const PLATFORM_FEE_BPS = 0; // 0% by default — connected user keeps the full amount

function bpsToCents(amountCents: number): number {
  if (PLATFORM_FEE_BPS <= 0) return 0;
  return Math.max(0, Math.floor((amountCents * PLATFORM_FEE_BPS) / 10_000));
}

/**
 * Locates or creates the Stripe Customer that represents the StackZen client
 * on the connected account. Customers belong to the connected account so the
 * user retains full ownership of their CRM in Stripe.
 */
async function ensureClientStripeCustomer(params: {
  stripeAccountId: string;
  client: { id: string; name: string; email: string | null };
}): Promise<string> {
  const stripe = getStripe();
  const search = await stripe.customers.search(
    { query: `metadata['stackzenClientId']:'${params.client.id}'` },
    { stripeAccount: params.stripeAccountId }
  );
  if (search.data[0]) return search.data[0].id;

  const customer = await stripe.customers.create(
    {
      name: params.client.name,
      email: params.client.email ?? undefined,
      metadata: { stackzenClientId: params.client.id },
    },
    { stripeAccount: params.stripeAccountId }
  );
  return customer.id;
}

/**
 * Mirrors a StackZen invoice as a Stripe Invoice on the user's connected
 * account and returns the hosted payment URL. Re-running on the same invoice
 * is idempotent — we hand back the existing hosted URL if one exists.
 */
export async function createPayableStripeInvoice(args: {
  userId: string;
  invoiceId: string;
}): Promise<PayableInvoiceResult> {
  const invoice = await prisma.invoice.findFirst({
    where: { id: args.invoiceId, userId: args.userId },
    include: { client: true, lineItems: true },
  });
  if (!invoice) throw new Error('Invoice not found');

  if (invoice.status === 'paid') {
    throw new Error('Invoice has already been paid');
  }

  const user = await prisma.user.findUnique({
    where: { id: args.userId },
    select: {
      stripeAccountId: true,
      stripeChargesEnabled: true,
    },
  });

  if (!user?.stripeAccountId) {
    throw new Error('Connect your Stripe account before generating payment links');
  }
  if (!user.stripeChargesEnabled) {
    throw new Error('Your Stripe account is not yet ready to accept payments');
  }

  const stripe = getStripe();

  if (invoice.stripeInvoiceId && invoice.stripeHostedInvoiceUrl) {
    return {
      invoiceId: invoice.id,
      stripeInvoiceId: invoice.stripeInvoiceId,
      hostedInvoiceUrl: invoice.stripeHostedInvoiceUrl,
      invoicePdfUrl: invoice.stripeInvoicePdfUrl,
    };
  }

  const customerId = await ensureClientStripeCustomer({
    stripeAccountId: user.stripeAccountId,
    client: invoice.client,
  });

  const due = invoice.dueDate.getTime();
  const now = Date.now();
  const daysUntilDue = Math.max(1, Math.ceil((due - now) / (1000 * 60 * 60 * 24)));
  const amountCents = Math.round(invoice.amount * 100);

  // `application_fee_amount` is intentionally omitted unless platform fees are
  // active. Re-evaluating once instead of inside the spread keeps the call
  // site readable when fees are flipped on later.
  // amountCents is currently only needed when fees are enabled — kept here
  // so the call below can compute it without re-summing line items.
  const draft = await stripe.invoices.create(
    {
      customer: customerId,
      collection_method: 'send_invoice',
      days_until_due: daysUntilDue,
      auto_advance: false,
      description: `StackZen invoice ${invoice.number}`,
      metadata: {
        stackzenInvoiceId: invoice.id,
        stackzenUserId: args.userId,
        stackzenInvoiceNumber: invoice.number,
      },
      ...(PLATFORM_FEE_BPS > 0
        ? { application_fee_amount: bpsToCents(amountCents) }
        : {}),
    },
    { stripeAccount: user.stripeAccountId }
  );

  if (!draft.id) throw new Error('Stripe did not return an invoice id');
  const draftId = draft.id;

  for (const item of invoice.lineItems) {
    // Stripe v18's `invoiceItems.create` exposes the total line amount via
    // `amount` (cents). Per-unit display happens through `description` so
    // non-technical users get a readable invoice without needing pre-built
    // Products in their Stripe dashboard.
    const lineDescription =
      item.quantity > 1
        ? `${item.description} (${item.quantity} × $${item.unitPrice.toFixed(2)})`
        : item.description;

    await stripe.invoiceItems.create(
      {
        customer: customerId,
        invoice: draftId,
        amount: Math.round(item.unitPrice * item.quantity * 100),
        description: lineDescription,
      },
      { stripeAccount: user.stripeAccountId }
    );
  }

  const finalized = await stripe.invoices.finalizeInvoice(draftId, undefined, {
    stripeAccount: user.stripeAccountId,
  });
  if (!finalized.id) throw new Error('Stripe did not return a finalized invoice id');
  const finalizedId = finalized.id;

  await stripe.invoices.sendInvoice(finalizedId, undefined, {
    stripeAccount: user.stripeAccountId,
  });

  if (!finalized.hosted_invoice_url) {
    throw new Error('Stripe did not return a hosted payment URL');
  }

  // PaymentIntent IDs are not yet known at finalize time — Stripe creates
  // them lazily when the client opens the hosted page. The webhook handler
  // backfills `stripePaymentIntentId` once a payment is attempted/succeeds.
  await prisma.invoice.update({
    where: { id: invoice.id },
    data: {
      paymentEnabled: true,
      stripeInvoiceId: finalizedId,
      stripeHostedInvoiceUrl: finalized.hosted_invoice_url,
      stripeInvoicePdfUrl: finalized.invoice_pdf ?? null,
    },
  });

  return {
    invoiceId: invoice.id,
    stripeInvoiceId: finalizedId,
    hostedInvoiceUrl: finalized.hosted_invoice_url,
    invoicePdfUrl: finalized.invoice_pdf ?? null,
  };
}

/**
 * Pulls the PaymentIntent ID off a Stripe Invoice in a way that survives the
 * v18 schema change (Stripe replaced top-level `payment_intent` with the
 * `payments` ApiList).
 */
function extractPaymentIntentId(stripeInvoice: Stripe.Invoice): string | null {
  const payments = (stripeInvoice as { payments?: { data?: Array<{ payment?: { payment_intent?: string | { id?: string } } }> } }).payments;
  const head = payments?.data?.[0]?.payment?.payment_intent;
  if (!head) return null;
  return typeof head === 'string' ? head : (head.id ?? null);
}

/**
 * Used by the webhook handler when Stripe reports a payment. Marks the
 * StackZen invoice paid in a single transaction and returns it for downstream
 * bookkeeping (financial events, automation).
 */
export async function markInvoicePaidFromStripe(args: {
  stripeInvoice: Stripe.Invoice;
}): Promise<{ id: string; userId: string; amount: number; jobId: string | null } | null> {
  const stackzenInvoiceId = args.stripeInvoice.metadata?.stackzenInvoiceId;
  const stackzenUserId = args.stripeInvoice.metadata?.stackzenUserId;
  if (!stackzenInvoiceId || !stackzenUserId) return null;

  const paymentIntentId = extractPaymentIntentId(args.stripeInvoice);
  const updated = await prisma.invoice.updateMany({
    where: {
      id: stackzenInvoiceId,
      userId: stackzenUserId,
      status: { not: 'paid' },
    },
    data: {
      status: 'paid',
      paidAt: new Date(),
      ...(paymentIntentId ? { stripePaymentIntentId: paymentIntentId } : {}),
    },
  });
  if (updated.count === 0) return null;

  const fresh = await prisma.invoice.findUnique({
    where: { id: stackzenInvoiceId },
    select: { id: true, userId: true, amount: true, jobId: true },
  });
  return fresh;
}
