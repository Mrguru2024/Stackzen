import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuthSession } from '@/lib/api/require-auth';
import {
  JobStatus,
  FinancialEntityType,
  FinancialEventSource,
  FinancialEventType,
} from '@prisma/client';
import { createFinancialEventSafe } from '@/lib/financial-events/events';
import { auditFinancialEvent } from '@/lib/security/financial-audit';
import { logSafeError } from '@/lib/security/safe-log';

const bodySchema = z
  .object({
    clientId: z.string().cuid().optional(),
    dueDate: z.string().datetime().optional(),
    amount: z.number().positive().finite().optional(),
    cost: z.number().nonnegative().finite().optional(),
  })
  .strict();

async function getNextInvoiceNumber(): Promise<string> {
  const lastInvoice = await prisma.invoice.findFirst({
    orderBy: { createdAt: 'desc' },
    select: { number: true },
  });

  if (!lastInvoice?.number) {
    return 'INV-1001';
  }

  const [, rawNumber] = lastInvoice.number.split('-');
  const parsed = Number.parseInt(rawNumber ?? '', 10);
  const next = Number.isFinite(parsed) ? parsed + 1 : 1001;
  return `INV-${next}`;
}

export async function POST(
  request: Request,
  context: { params: Promise<{ quoteId: string }> }
) {
  const { session, response } = await requireAuthSession();
  if (response) return response;

  try {
    const { quoteId } = await context.params;

    let payload: unknown;
    try {
      payload = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const parsed = bodySchema.safeParse(payload);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const quote = await prisma.quote.findFirst({
      where: { id: quoteId, userId: session.user.id },
      include: {
        job: {
          select: { id: true, clientId: true, status: true },
        },
      },
    });
    if (!quote) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
    }

    const resolvedClientId = parsed.data.clientId ?? quote.job?.clientId;
    if (!resolvedClientId) {
      return NextResponse.json(
        { error: 'clientId is required when quote is not linked to a job' },
        { status: 400 }
      );
    }

    const client = await prisma.client.findFirst({
      where: { id: resolvedClientId, userId: session.user.id },
      select: { id: true },
    });
    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const amount = parsed.data.amount ?? 0;
    const cost = parsed.data.cost;
    const profit = typeof cost === 'number' ? amount - cost : null;
    const number = await getNextInvoiceNumber();

    const invoice = await prisma.$transaction(async tx => {
      const created = await tx.invoice.create({
        data: {
          number,
          clientId: resolvedClientId,
          userId: session.user.id,
          jobId: quote.jobId,
          quoteId: quote.id,
          dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : new Date(),
          amount,
          cost,
          profit,
          status: 'pending',
          notes: quote.content,
          lineItems: {
            create: [
              {
                description: quote.title,
                quantity: 1,
                unitPrice: amount,
                amount,
              },
            ],
          },
        },
        include: {
          lineItems: true,
          client: true,
        },
      });

      await tx.quote.update({
        where: { id: quote.id },
        data: { status: 'converted' },
      });

      if (quote.job?.id) {
        const nextStatus =
          quote.job.status === JobStatus.NEW ? JobStatus.QUOTED : quote.job.status;
        await tx.job.update({
          where: { id: quote.job.id },
          data: {
            status: nextStatus,
          },
        });
      }

      return created;
    });

    await createFinancialEventSafe({
      userId: session.user.id,
      type: FinancialEventType.QUOTE_CONVERTED,
      source: FinancialEventSource.API_QUOTES,
      amount: invoice.amount,
      relatedEntityType: FinancialEntityType.QUOTE,
      relatedEntityId: quote.id,
      metadata: {
        quoteId: quote.id,
        invoiceId: invoice.id,
        invoiceNumber: invoice.number,
        jobId: invoice.jobId,
      },
    });

    await createFinancialEventSafe({
      userId: session.user.id,
      type: FinancialEventType.INVOICE_CREATED,
      source: FinancialEventSource.API_QUOTES,
      amount: invoice.amount,
      relatedEntityType: FinancialEntityType.INVOICE,
      relatedEntityId: invoice.id,
      metadata: {
        invoiceId: invoice.id,
        invoiceNumber: invoice.number,
        quoteId: quote.id,
        jobId: invoice.jobId,
        status: invoice.status,
      },
    });

    if (quote.job?.id && quote.job.status === JobStatus.NEW) {
      await createFinancialEventSafe({
        userId: session.user.id,
        type: FinancialEventType.JOB_STATUS_CHANGED,
        source: FinancialEventSource.API_JOBS,
        relatedEntityType: FinancialEntityType.JOB,
        relatedEntityId: quote.job.id,
        metadata: {
          jobId: quote.job.id,
          previousStatus: quote.job.status,
          status: JobStatus.QUOTED,
          trigger: 'quote-converted',
          quoteId: quote.id,
          invoiceId: invoice.id,
        },
      });
    }

    await auditFinancialEvent({
      userId: session.user.id,
      action: 'quote.converted',
      resource: quote.id,
      details: { invoiceId: invoice.id, invoiceNumber: invoice.number },
    });

    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    logSafeError('QUOTE_CONVERT', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

