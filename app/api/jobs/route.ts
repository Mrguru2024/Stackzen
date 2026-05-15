import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuthSession } from '@/lib/api/require-auth';
import { prisma } from '@/lib/prisma';
import {
  FinancialEntityType,
  FinancialEventSource,
  FinancialEventType,
  IncomeProfileType,
  JobDepositType,
  JobPaymentType,
  JobStatus,
  JobWorkType,
} from '@prisma/client';
import { createFinancialEventSafe } from '@/lib/financial-events/events';
import { recomputeJobRevenue } from '@/lib/jobs/revenue';

const createJobSchema = z
  .object({
    clientId: z.string().cuid(),
    serviceId: z.string().cuid().optional(),
    title: z.string().min(1).max(200),
    description: z.string().max(4000).optional(),
    estimatedAmount: z.number().nonnegative().finite().optional(),
    status: z.nativeEnum(JobStatus).optional(),
    workType: z.nativeEnum(JobWorkType).optional(),
    paymentType: z.nativeEnum(JobPaymentType).optional(),
    sourceLabel: z.string().max(200).optional(),
    incomeProfileType: z.nativeEnum(IncomeProfileType).optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    assignedTechIds: z.array(z.string().cuid()).optional(),
    depositRequired: z.boolean().optional(),
    depositType: z.nativeEnum(JobDepositType).optional(),
    depositPercentage: z.number().min(0).max(100).optional(),
    depositFixedAmount: z.number().nonnegative().finite().optional(),
  })
  .strict();

export async function GET() {
  const { session, response } = await requireAuthSession();
  if (response) return response;

  const jobs = await prisma.job.findMany({
    where: { userId: session.user.id },
    include: {
      client: true,
      service: true,
      quotes: true,
      invoices: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(jobs);
}

export async function POST(request: Request) {
  const { session, response } = await requireAuthSession();
  if (response) return response;

  try {
    const json = await request.json();
    const parsed = createJobSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const input = parsed.data;
    const [client, service, techCount] = await Promise.all([
      prisma.client.findFirst({
        where: { id: input.clientId, userId: session.user.id },
        select: { id: true },
      }),
      input.serviceId
        ? prisma.service.findUnique({ where: { id: input.serviceId }, select: { id: true } })
        : Promise.resolve(null),
      input.assignedTechIds?.length
        ? prisma.user.count({
            where: { id: { in: input.assignedTechIds } },
          })
        : Promise.resolve(0),
    ]);

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }
    if (input.serviceId && !service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }
    if (input.assignedTechIds && techCount !== input.assignedTechIds.length) {
      return NextResponse.json({ error: 'One or more assigned techs are invalid' }, { status: 400 });
    }

    const job = await prisma.job.create({
      data: {
        userId: session.user.id,
        clientId: input.clientId,
        serviceId: input.serviceId,
        title: input.title,
        description: input.description,
        estimatedAmount: input.estimatedAmount,
        workType: input.workType,
        paymentType: input.paymentType,
        sourceLabel: input.sourceLabel,
        incomeProfileType: input.incomeProfileType,
        depositRequired: input.depositRequired ?? false,
        depositType:
          input.depositType ??
          (input.depositRequired ? JobDepositType.PERCENTAGE : JobDepositType.NONE),
        depositPercentage: input.depositPercentage,
        depositFixedAmount: input.depositFixedAmount,
        remainingBalance: input.estimatedAmount ?? null,
        status: input.status ?? JobStatus.NEW,
        startDate: input.startDate ? new Date(input.startDate) : null,
        endDate: input.endDate ? new Date(input.endDate) : null,
        assignedTechs: input.assignedTechIds
          ? { connect: input.assignedTechIds.map(id => ({ id })) }
          : undefined,
      },
      include: {
        client: true,
        service: true,
        assignedTechs: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    await createFinancialEventSafe({
      userId: session.user.id,
      type: FinancialEventType.JOB_CREATED,
      source: FinancialEventSource.API_JOBS,
      relatedEntityType: FinancialEntityType.JOB,
      relatedEntityId: job.id,
      metadata: {
        jobId: job.id,
        title: job.title,
        status: job.status,
        workType: job.workType,
        paymentType: job.paymentType,
        sourceLabel: job.sourceLabel,
        incomeProfileType: job.incomeProfileType,
      },
    });

    await recomputeJobRevenue(job.id, session.user.id);

    return NextResponse.json(job, { status: 201 });
  } catch (error) {
    console.error('[JOBS_POST]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

