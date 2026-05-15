import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuthSession } from '@/lib/api/require-auth';
import {
  FinancialEntityType,
  FinancialEventSource,
  FinancialEventType,
  JobStatus,
} from '@prisma/client';
import { createFinancialEventSafe } from '@/lib/financial-events/events';

const bodySchema = z
  .object({
    dueDate: z.string().datetime().optional(),
    notes: z.string().max(3000).optional(),
    totalAmount: z.number().positive().finite().optional(),
    cost: z.number().nonnegative().finite().optional(),
  })
  .strict();

async function getNextInvoiceNumber(): Promise<string> {
  const lastInvoice = await prisma.invoice.findFirst({
    orderBy: { createdAt: 'desc' },
    select: { number: true },
  });
  if (!lastInvoice?.number) return 'INV-1001';
  const parsed = Number.parseInt(lastInvoice.number.split('-')[1] ?? '', 10);
  const next = Number.isFinite(parsed) ? parsed + 1 : 1001;
  return `INV-${next}`;
}

export async function POST(
  request: Request,
  context: { params: Promise<{ jobId: string }> }
) {
  const { session, response } = await requireAuthSession();
  if (response) return response;

  try {
    const { jobId } = await context.params;
    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });

    const job = await prisma.job.findFirst({
      where: { id: jobId, userId: session.user.id },
      select: {
        id: true,
        title: true,
        clientId: true,
        estimatedAmount: true,
        status: true,
      },
    });
    if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 });

    const contractTotal = parsed.data.totalAmount ?? job.estimatedAmount;
    if (!contractTotal || contractTotal <= 0) {
      return NextResponse.json({ error: 'Job total amount is required to create final invoice' }, { status: 400 });
    }

    const paidDepositsAggregate = await prisma.invoice.aggregate({
      where: {
        jobId: job.id,
        userId: session.user.id,
        invoiceType: 'deposit',
        status: 'paid',
      },
      _sum: { amount: true },
    });
    const paidDeposits = paidDepositsAggregate._sum.amount ?? 0;
    const remainingAmount = Math.max(contractTotal - paidDeposits, 0);
    const quote = await prisma.quote.findFirst({
      where: { jobId: job.id, userId: session.user.id },
      select: { id: true },
    });

    const cost = parsed.data.cost;
    const profit = typeof cost === 'number' ? remainingAmount - cost : null;
    const number = await getNextInvoiceNumber();

    const invoice = await prisma.$transaction(async tx => {
      const created = await tx.invoice.create({
        data: {
          number,
          clientId: job.clientId,
          userId: session.user.id,
          jobId: job.id,
          quoteId: quote?.id ?? null,
          dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : new Date(),
          amount: remainingAmount,
          cost,
          profit,
          invoiceType: 'final',
          status: 'pending',
          notes: parsed.data.notes ?? `Final invoice for job: ${job.title}`,
          lineItems: {
            create: [
              {
                description: `Final balance - ${job.title}`,
                quantity: 1,
                unitPrice: remainingAmount,
                amount: remainingAmount,
              },
            ],
          },
        },
        include: { lineItems: true, client: true },
      });

      await tx.job.update({
        where: { id: job.id },
        data: {
          estimatedAmount: contractTotal,
          depositPaid: paidDeposits,
          remainingBalance: remainingAmount,
          status: JobStatus.AWAITING_PAYMENT,
        },
      });

      return created;
    });

    await createFinancialEventSafe({
      userId: session.user.id,
      type: FinancialEventType.JOB_STATUS_CHANGED,
      source: FinancialEventSource.API_JOBS,
      relatedEntityType: FinancialEntityType.JOB,
      relatedEntityId: job.id,
      metadata: {
        jobId: job.id,
        status: JobStatus.AWAITING_PAYMENT,
        previousStatus: job.status,
        trigger: 'final-invoice-created',
        invoiceId: invoice.id,
      },
    });

    return NextResponse.json(
      {
        invoice,
        contractTotal,
        paidDeposits,
        remainingAmount,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[JOB_FINAL_INVOICE_POST]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

