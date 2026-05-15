import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import Stripe from 'stripe';
import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { applyJobStatusFromPaymentChange } from '@/lib/jobs/apply-status-from-payment';
import {
  FinancialEntityType,
  FinancialEventSource,
  FinancialEventType,
  FinancialTransactionDirection,
  FinancialTransactionSource,
  TransactionCategoryKind,
} from '@prisma/client';
import { createFinancialEventSafe } from '@/lib/financial-events/events';
import { mergeOperationalFromTransactionClassification } from '@/lib/financial-automation/classification';
import { buildTransactionDedupeHash } from '@/lib/financial-automation/transactions';
import { evaluateAutomationForTransaction, createAutomationNotification } from '@/lib/financial-automation/rules-engine';
import { markInvoicePaidFromStripe } from '@/lib/stripe/invoices';

const cuidSchema = z.string().cuid();

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key?.trim()) {
    throw new Error('STRIPE_SECRET_KEY is not configured');
  }
  return new Stripe(key, { apiVersion: '2025-05-28.basil' });
}

async function updateInvoiceFromStripeMetadata(
  invoiceIdRaw: string | undefined,
  userIdRaw: string | undefined,
  data: { status: string },
  amountCents: number | null | undefined
): Promise<{ id: string; userId: string; amount: number; status: string } | null> {
  const invoiceId = cuidSchema.safeParse(invoiceIdRaw);
  const userId = cuidSchema.safeParse(userIdRaw);
  if (!invoiceId.success || !userId.success) {
    return null;
  }

  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId.data, userId: userId.data },
  });
  if (!invoice) {
    return null;
  }

  if (amountCents != null) {
    const expected = Math.round(invoice.amount * 100);
    if (amountCents !== expected) {
      console.warn('[stripe-webhook] amount mismatch for invoice', invoice.id);
      return null;
    }
  }

  const updated = await prisma.invoice.update({
    where: { id: invoice.id, userId: invoice.userId },
    data,
  });

  if (updated.jobId) {
    await applyJobStatusFromPaymentChange(updated.jobId, updated.userId, {
      paymentFailed: data.status === 'failed',
    });
  }

  await createFinancialEventSafe({
    userId: updated.userId,
    type: FinancialEventType.INVOICE_STATUS_CHANGED,
    source: FinancialEventSource.API_INVOICES,
    amount: updated.amount,
    relatedEntityType: FinancialEntityType.INVOICE,
    relatedEntityId: updated.id,
    metadata: {
      invoiceId: updated.id,
      status: updated.status,
    },
  });

  return {
    id: updated.id,
    userId: updated.userId,
    amount: updated.amount,
    status: updated.status,
  };
}

function isUniqueViolation(err: unknown): boolean {
  return err instanceof PrismaClientKnownRequestError && err.code === 'P2002';
}

/**
 * Stripe webhook — raw body + signature verification only (no request.json() before verify).
 * Idempotency: `StripeEvent.id` stores Stripe `event.id`; duplicates return 200 without re-processing.
 */
export async function POST(req: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!webhookSecret) {
    console.error('[stripe-webhook] STRIPE_WEBHOOK_SECRET is not set');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }

  let rawBody: string;
  try {
    rawBody = await req.text();
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }

  const sig = (await headers()).get('stripe-signature');
  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature' }, { status: 400 });
  }

  const stripe = getStripe();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch {
    console.error('[stripe-webhook] signature verification failed');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const existing = await prisma.stripeEvent.findUnique({ where: { id: event.id } });
  if (existing) {
    return new NextResponse(null, { status: 200 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const updatedInvoice = await updateInvoiceFromStripeMetadata(
          session.metadata?.invoiceId,
          session.metadata?.userId,
          { status: 'paid' },
          session.amount_total
        );
        if (updatedInvoice) {
          await upsertInvoicePaymentTransaction({
            invoiceId: updatedInvoice.id,
            userId: updatedInvoice.userId,
            amount: updatedInvoice.amount,
            externalId: event.id,
          });
        }
        break;
      }
      case 'payment_intent.succeeded': {
        const pi = event.data.object as Stripe.PaymentIntent;
        const updatedInvoice = await updateInvoiceFromStripeMetadata(
          pi.metadata?.invoiceId,
          pi.metadata?.userId,
          { status: 'paid' },
          pi.amount
        );
        if (updatedInvoice) {
          await upsertInvoicePaymentTransaction({
            invoiceId: updatedInvoice.id,
            userId: updatedInvoice.userId,
            amount: updatedInvoice.amount,
            externalId: pi.id,
          });
        }
        break;
      }
      case 'payment_intent.payment_failed': {
        const pi = event.data.object as Stripe.PaymentIntent;
        const updatedInvoice = await updateInvoiceFromStripeMetadata(
          pi.metadata?.invoiceId,
          pi.metadata?.userId,
          { status: 'failed' },
          pi.amount
        );
        if (updatedInvoice) {
          await createAutomationNotification({
            userId: updatedInvoice.userId,
            type: 'AUTOMATION_ACTION',
            severity: 'WARNING',
            title: 'Invoice payment failed',
            body: `Payment failed for invoice ${updatedInvoice.id}. Please retry collection.`,
            relatedEntityType: FinancialEntityType.INVOICE,
            relatedEntityId: updatedInvoice.id,
            metadata: { stripePaymentIntentId: pi.id },
          });
        }
        break;
      }
      case 'invoice.paid':
      case 'invoice.payment_succeeded': {
        // Connect-routed Stripe Invoice payments (the new "Get Paid" flow).
        const stripeInvoice = event.data.object as Stripe.Invoice;
        const updated = await markInvoicePaidFromStripe({ stripeInvoice });
        if (updated) {
          await upsertInvoicePaymentTransaction({
            invoiceId: updated.id,
            userId: updated.userId,
            amount: updated.amount,
            externalId: stripeInvoice.id ?? event.id,
          });
          if (updated.jobId) {
            await applyJobStatusFromPaymentChange(updated.jobId, updated.userId);
          }
        }
        break;
      }
      case 'invoice.payment_failed': {
        const stripeInvoice = event.data.object as Stripe.Invoice;
        const stackzenInvoiceId = stripeInvoice.metadata?.stackzenInvoiceId;
        const stackzenUserId = stripeInvoice.metadata?.stackzenUserId;
        if (stackzenInvoiceId && stackzenUserId) {
          await createAutomationNotification({
            userId: stackzenUserId,
            type: 'AUTOMATION_ACTION',
            severity: 'WARNING',
            title: 'Invoice payment failed',
            body: 'A client tried to pay one of your invoices but the charge failed. The hosted payment link is still active — they can try again.',
            relatedEntityType: FinancialEntityType.INVOICE,
            relatedEntityId: stackzenInvoiceId,
            metadata: { stripeInvoiceId: stripeInvoice.id },
          });
        }
        break;
      }
      case 'account.updated': {
        const account = event.data.object as Stripe.Account;
        const target = await prisma.user.findFirst({
          where: { stripeAccountId: account.id },
          select: { id: true },
        });
        if (target) {
          const detailsSubmitted = Boolean(account.details_submitted);
          const status: string = !detailsSubmitted
            ? 'onboarding'
            : account.charges_enabled && account.payouts_enabled
              ? 'active'
              : 'restricted';
          await prisma.user.update({
            where: { id: target.id },
            data: {
              stripeChargesEnabled: Boolean(account.charges_enabled),
              stripePayoutsEnabled: Boolean(account.payouts_enabled),
              stripeDetailsSubmitted: detailsSubmitted,
              stripeAccountStatus: status,
              stripeAccountSyncedAt: new Date(),
            },
          });
        }
        break;
      }
      default:
        break;
    }

    try {
      await prisma.stripeEvent.create({
        data: {
          id: event.id,
          type: event.type,
          createdAt: new Date((event.created || 0) * 1000),
        },
      });
    } catch (err) {
      if (isUniqueViolation(err)) {
        return new NextResponse(null, { status: 200 });
      }
      throw err;
    }

    return new NextResponse(null, { status: 200 });
  } catch {
    console.error('[stripe-webhook] handler error');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function upsertInvoicePaymentTransaction(input: {
  invoiceId: string;
  userId: string;
  amount: number;
  externalId: string;
}) {
  const category = await prisma.transactionCategory.upsert({
    where: {
      userId_name_kind: {
        userId: input.userId,
        name: 'Invoice Payment',
        kind: TransactionCategoryKind.INCOME,
      },
    },
    update: {},
    create: {
      userId: input.userId,
      name: 'Invoice Payment',
      kind: TransactionCategoryKind.INCOME,
      isSystem: true,
    },
  });

  const postedAt = new Date();
  const description = `Invoice payment ${input.invoiceId}`;
  const dedupeHash = buildTransactionDedupeHash({
    source: FinancialTransactionSource.INVOICE_PAYMENT,
    externalId: input.externalId,
    postedAt,
    amount: input.amount,
    description,
  });

  const operationalMetadata = mergeOperationalFromTransactionClassification(null, {
    direction: FinancialTransactionDirection.INFLOW,
    description,
    userCategoryNameHint: 'Invoice Payment',
    plaidPersonalFinanceDetailed: null,
  });

  const transaction = await prisma.financialTransaction.upsert({
    where: {
      userId_dedupeHash: {
        userId: input.userId,
        dedupeHash,
      },
    },
    update: {
      amount: input.amount,
      direction: FinancialTransactionDirection.INFLOW,
      invoiceId: input.invoiceId,
      categoryId: category.id,
      categoryName: category.name,
      description,
      metadata: operationalMetadata as Prisma.InputJsonValue,
    },
    create: {
      userId: input.userId,
      source: FinancialTransactionSource.INVOICE_PAYMENT,
      externalId: input.externalId,
      dedupeHash,
      postedAt,
      amount: input.amount,
      direction: FinancialTransactionDirection.INFLOW,
      description,
      categoryId: category.id,
      categoryName: category.name,
      invoiceId: input.invoiceId,
      metadata: operationalMetadata as Prisma.InputJsonValue,
    },
  });

  await createFinancialEventSafe({
    userId: input.userId,
    type: FinancialEventType.TRANSACTION_CREATED,
    source: FinancialEventSource.API_INVOICES,
    amount: transaction.amount,
    relatedEntityType: FinancialEntityType.TRANSACTION,
    relatedEntityId: transaction.id,
    metadata: {
      source: transaction.source,
      invoiceId: input.invoiceId,
    },
  });

  await evaluateAutomationForTransaction({
    userId: input.userId,
    transactionId: transaction.id,
    amount: transaction.amount,
    categoryName: transaction.categoryName,
    direction: transaction.direction,
    triggerRef: 'stripe-payment',
  });
}
