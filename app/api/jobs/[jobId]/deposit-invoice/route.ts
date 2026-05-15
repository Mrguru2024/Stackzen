import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuthSession } from '@/lib/api/require-auth';
import {
  FinancialEntityType,
  FinancialEventSource,
  FinancialEventType,
  JobDepositType,
  JobStatus,
} from '@prisma/client';
import { createFinancialEventSafe } from '@/lib/financial-events/events';

const bodySchema = z
  .object({
    depositPercentage: z.number().min(1).max(100).optional(),
    dueDate: z.string().datetime().optional(),
    notes: z.string().max(3000).optional(),
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
        depositRequired: true,
        depositType: true,
        depositPercentage: true,
        depositFixedAmount: true,
      },
    });
    if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 });

    if (!job.depositRequired) {
      return NextResponse.json(
        {
          error:
            'Deposit invoices are only available when deposit is required. Update the job deposit policy first.',
        },
        { status: 400 }
      );
    }

    if (job.depositType === JobDepositType.NONE) {
      return NextResponse.json(
        {
          error: 'Set deposit type to percentage or fixed amount on the job before creating a deposit invoice.',
        },
        { status: 400 }
      );
    }

    const estimatedAmount = job.estimatedAmount;
    if (!estimatedAmount || estimatedAmount <= 0) {
      return NextResponse.json(
        { error: 'Job estimatedAmount is required for deposit invoices' },
        { status: 400 }
      );
    }

    let amount: number;
    let lineDescription: string;

    if (job.depositType === JobDepositType.FIXED_AMOUNT) {
      const fixed = job.depositFixedAmount;
      if (!fixed || fixed <= 0) {
        return NextResponse.json(
          { error: 'Set depositFixedAmount on the job for a fixed deposit invoice.' },
          { status: 400 }
        );
      }
      amount = Number(fixed.toFixed(2));
      lineDescription = `Deposit (fixed) - ${job.title}`;
    } else {
      const pct = parsed.data.depositPercentage ?? job.depositPercentage ?? 0;
      if (pct < 1 || pct > 100) {
        return NextResponse.json(
          { error: 'Provide depositPercentage (1–100) or set default depositPercentage on the job.' },
          { status: 400 }
        );
      }
      amount = Number(((estimatedAmount * pct) / 100).toFixed(2));
      lineDescription = `Deposit (${pct}%) - ${job.title}`;
    }

    const quote = await prisma.quote.findFirst({
      where: { jobId: job.id, userId: session.user.id },
      select: { id: true },
    });

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
          amount,
          invoiceType: 'deposit',
          status: 'pending',
          notes: parsed.data.notes ?? `Deposit invoice for job: ${job.title}`,
          lineItems: {
            create: [
              {
                description: lineDescription,
                quantity: 1,
                unitPrice: amount,
                amount,
              },
            ],
          },
        },
        include: { lineItems: true, client: true },
      });

      const pctForJob =
        job.depositType === JobDepositType.PERCENTAGE
          ? parsed.data.depositPercentage ?? job.depositPercentage ?? 0
          : job.depositPercentage;

      await tx.job.update({
        where: { id: job.id },
        data: {
          ...(job.depositType === JobDepositType.PERCENTAGE && pctForJob
            ? { depositPercentage: pctForJob }
            : {}),
          remainingBalance: Math.max(estimatedAmount - amount, 0),
          status: JobStatus.DEPOSIT_PENDING,
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
        status: JobStatus.DEPOSIT_PENDING,
        previousStatus: job.status,
        trigger: 'deposit-invoice-created',
        invoiceId: invoice.id,
      },
    });

    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    console.error('[JOB_DEPOSIT_INVOICE_POST]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
