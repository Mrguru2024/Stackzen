import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  FinancialEntityType,
  FinancialEventSource,
  FinancialEventType,
  IncomeProfileType,
  JobDepositStatus,
  JobDepositType,
  JobPaymentType,
  JobStatus,
  JobWorkType,
} from '@prisma/client';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireAuthSession } from '@/lib/api/require-auth';
import { recomputeJobRevenue } from '@/lib/jobs/revenue';
import { createFinancialEventSafe } from '@/lib/financial-events/events';
import { canStartWorkWhileDepositRequired } from '@/lib/jobs/deposit-status';

const updateJobSchema = z
  .object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().max(4000).optional(),
    status: z.nativeEnum(JobStatus).optional(),
    workType: z.nativeEnum(JobWorkType).optional(),
    paymentType: z.nativeEnum(JobPaymentType).optional(),
    sourceLabel: z.string().max(200).optional(),
    incomeProfileType: z.nativeEnum(IncomeProfileType).optional(),
    estimatedAmount: z.number().nonnegative().finite().optional(),
    depositPercentage: z.number().min(0).max(100).optional(),
    depositRequired: z.boolean().optional(),
    depositType: z.nativeEnum(JobDepositType).optional(),
    depositFixedAmount: z.number().nonnegative().finite().optional(),
    depositWaived: z.boolean().optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    completedAt: z.string().datetime().optional(),
    assignedTechIds: z.array(z.string().cuid()).optional(),
  })
  .strict();

export async function GET(_request: Request, context: { params: Promise<{ jobId: string }> }) {
  const { session, response } = await requireAuthSession();
  if (response) return response;

  const { jobId } = await context.params;

  await recomputeJobRevenue(jobId, session.user.id);

  const job = await prisma.job.findFirst({
    where: { id: jobId, userId: session.user.id },
    include: {
      client: true,
      service: true,
      assignedTechs: { select: { id: true, name: true, email: true } },
      quotes: true,
      invoices: { include: { lineItems: true } },
      expenses: true,
    },
  });
  if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 });

  return NextResponse.json(job);
}

export async function PATCH(request: Request, context: { params: Promise<{ jobId: string }> }) {
  const { session, response } = await requireAuthSession();
  if (response) return response;

  try {
    const { jobId } = await context.params;
    const parsed = updateJobSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });

    const existing = await prisma.job.findFirst({
      where: { id: jobId, userId: session.user.id },
      select: {
        id: true,
        estimatedAmount: true,
        status: true,
        depositRequired: true,
        depositType: true,
        depositFixedAmount: true,
        depositPercentage: true,
        depositWaived: true,
      },
    });
    if (!existing) return NextResponse.json({ error: 'Job not found' }, { status: 404 });

    const input = parsed.data;
    if (input.assignedTechIds) {
      const count = await prisma.user.count({ where: { id: { in: input.assignedTechIds } } });
      if (count !== input.assignedTechIds.length) {
        return NextResponse.json({ error: 'Invalid assigned tech id(s)' }, { status: 400 });
      }
    }

    if (input.status === JobStatus.IN_PROGRESS) {
      await recomputeJobRevenue(jobId, session.user.id);
      const gate = await prisma.job.findFirst({
        where: { id: jobId, userId: session.user.id },
        select: { depositRequired: true, depositWaived: true, depositStatus: true },
      });
      if (
        gate?.depositRequired &&
        !gate.depositWaived &&
        !canStartWorkWhileDepositRequired(gate.depositStatus)
      ) {
        return NextResponse.json(
          {
            error:
              'Deposit must be paid in full or waived before moving this job to In progress.',
          },
          { status: 409 }
        );
      }
    }

    const estimatedAmount = input.estimatedAmount ?? existing.estimatedAmount ?? 0;
    const depositPercentage = input.depositPercentage ?? undefined;
    const remainingBalance =
      typeof depositPercentage === 'number'
        ? Math.max(estimatedAmount - (estimatedAmount * depositPercentage) / 100, 0)
        : undefined;

    const policyChanged =
      (input.depositRequired !== undefined && input.depositRequired !== existing.depositRequired) ||
      (input.depositType !== undefined && input.depositType !== existing.depositType) ||
      (input.depositFixedAmount !== undefined && input.depositFixedAmount !== existing.depositFixedAmount) ||
      (input.depositPercentage !== undefined && input.depositPercentage !== existing.depositPercentage);

    const waivedNow = input.depositWaived === true && !existing.depositWaived;

    const data: Prisma.JobUpdateInput = {
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.workType !== undefined ? { workType: input.workType } : {}),
      ...(input.paymentType !== undefined ? { paymentType: input.paymentType } : {}),
      ...(input.sourceLabel !== undefined ? { sourceLabel: input.sourceLabel } : {}),
      ...(input.incomeProfileType !== undefined
        ? { incomeProfileType: input.incomeProfileType }
        : {}),
      ...(input.estimatedAmount !== undefined ? { estimatedAmount: input.estimatedAmount } : {}),
      ...(input.depositPercentage !== undefined ? { depositPercentage: input.depositPercentage } : {}),
      ...(input.depositRequired !== undefined ? { depositRequired: input.depositRequired } : {}),
      ...(input.depositType !== undefined ? { depositType: input.depositType } : {}),
      ...(input.depositFixedAmount !== undefined ? { depositFixedAmount: input.depositFixedAmount } : {}),
      ...(input.depositWaived !== undefined ? { depositWaived: input.depositWaived } : {}),
      ...(remainingBalance !== undefined ? { remainingBalance } : {}),
      ...(input.startDate !== undefined ? { startDate: new Date(input.startDate) } : {}),
      ...(input.endDate !== undefined ? { endDate: new Date(input.endDate) } : {}),
      ...(input.completedAt !== undefined ? { completedAt: new Date(input.completedAt) } : {}),
      ...(input.assignedTechIds
        ? { assignedTechs: { set: input.assignedTechIds.map(id => ({ id })) } }
        : {}),
    };

    if (input.depositRequired === false) {
      data.depositType = JobDepositType.NONE;
      data.depositWaived = false;
      data.depositStatus = JobDepositStatus.NOT_REQUIRED;
    }

    const updated = await prisma.job.update({
      where: { id: jobId },
      data,
      include: {
        client: true,
        service: true,
        assignedTechs: { select: { id: true, name: true, email: true } },
      },
    });

    await createFinancialEventSafe({
      userId: session.user.id,
      type:
        input.status !== undefined && input.status !== existing.status
          ? FinancialEventType.JOB_STATUS_CHANGED
          : FinancialEventType.JOB_UPDATED,
      source: FinancialEventSource.API_JOBS,
      relatedEntityType: FinancialEntityType.JOB,
      relatedEntityId: updated.id,
      metadata: {
        jobId: updated.id,
        title: updated.title,
        status: updated.status,
        previousStatus: existing.status,
        workType: updated.workType,
        paymentType: updated.paymentType,
        sourceLabel: updated.sourceLabel,
        incomeProfileType: updated.incomeProfileType,
      },
    });

    if (policyChanged) {
      await createFinancialEventSafe({
        userId: session.user.id,
        type: FinancialEventType.DEPOSIT_POLICY_UPDATED,
        source: FinancialEventSource.API_JOBS,
        relatedEntityType: FinancialEntityType.JOB,
        relatedEntityId: updated.id,
        metadata: {
          jobId: updated.id,
          depositRequired: updated.depositRequired,
          depositType: updated.depositType,
          depositPercentage: updated.depositPercentage,
          depositFixedAmount: updated.depositFixedAmount,
        },
      });
    }

    if (waivedNow) {
      await createFinancialEventSafe({
        userId: session.user.id,
        type: FinancialEventType.JOB_DEPOSIT_WAIVED,
        source: FinancialEventSource.API_JOBS,
        relatedEntityType: FinancialEntityType.JOB,
        relatedEntityId: updated.id,
        metadata: { jobId: updated.id },
      });
    }

    await recomputeJobRevenue(jobId, session.user.id);

    const full = await prisma.job.findFirst({
      where: { id: jobId, userId: session.user.id },
      include: {
        client: true,
        service: true,
        assignedTechs: { select: { id: true, name: true, email: true } },
        quotes: true,
        invoices: { include: { lineItems: true } },
        expenses: true,
      },
    });

    return NextResponse.json(full ?? updated);
  } catch (error) {
    console.error('[JOBS_PATCH]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
