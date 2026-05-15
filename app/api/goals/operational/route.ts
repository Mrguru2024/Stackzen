import { NextResponse } from 'next/server';
import { z } from 'zod';
import type { OperationalGoal, SmartBucket } from '@prisma/client';
import {
  FinancialEntityType,
  FinancialEventSource,
  FinancialEventType,
  GoalAutomationMode,
  OperationalGoalKind,
  OperationalGoalStatus,
  Prisma,
} from '@prisma/client';
import { requireAuthSession } from '@/lib/api/require-auth';
import { prisma } from '@/lib/prisma';
import { createFinancialEventSafe } from '@/lib/financial-events/events';
import { GOAL_FUND_BUCKET_TYPE } from '@/lib/goals/constants';
import { analyzeOperationalGoal } from '@/lib/goals/analyze';
import { buildCashFlowForecast } from '@/lib/cashflow/forecast';

const goalKindSchema = z.nativeEnum(OperationalGoalKind);
const automationModeSchema = z.nativeEnum(GoalAutomationMode);

const createBodySchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional().nullable(),
  goalKind: goalKindSchema,
  targetAmount: z.number().positive().finite(),
  targetDate: z.string().datetime().optional().nullable(),
  smartBucketId: z.string().min(1).optional().nullable(),
  /** When true and no bucket id, creates a GOAL_FUND bucket */
  createBucket: z.boolean().optional(),
  automationMode: automationModeSchema.optional(),
  automationConfig: z.record(z.unknown()).optional().nullable(),
  priority: z.number().int().min(0).max(1_000_000).optional(),
});

export async function GET() {
  const { session, response } = await requireAuthSession();
  if (response) return response;

  const goals = await prisma.operationalGoal.findMany({
    where: { userId: session.user.id },
    include: { smartBucket: true },
    orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
  });

  const forecast = await buildCashFlowForecast(session.user.id, { includeDetails: false });

  const withAnalysis = await Promise.all(
    goals.map(async g => {
      const analysis =
        g.status === OperationalGoalStatus.ACTIVE
          ? await analyzeOperationalGoal(session.user.id, g, { forecast })
          : null;
      return {
        id: g.id,
        name: g.name,
        description: g.description,
        goalKind: g.goalKind,
        targetAmount: g.targetAmount,
        targetDate: g.targetDate?.toISOString() ?? null,
        smartBucketId: g.smartBucketId,
        bucketName: g.smartBucket.name,
        bucketBalance: g.smartBucket.currentAmount,
        automationMode: g.automationMode,
        automationConfig: g.automationConfig,
        priority: g.priority,
        status: g.status,
        lastContributionAt: g.lastContributionAt?.toISOString() ?? null,
        createdAt: g.createdAt.toISOString(),
        analysis,
      };
    })
  );

  return NextResponse.json({ goals: withAnalysis });
}

export async function POST(request: Request) {
  const { session, response } = await requireAuthSession();
  if (response) return response;

  const raw = await request.json().catch(() => null);
  const parsed = createBodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload', details: parsed.error.flatten() }, { status: 400 });
  }

  const body = parsed.data;
  const userId = session.user.id;

  type GoalWithBucket = OperationalGoal & { smartBucket: SmartBucket };
  let createdGoal: GoalWithBucket | null = null;

  try {
    createdGoal = (await prisma.$transaction(async tx => {
      let bucketId = body.smartBucketId ?? null;

      if (bucketId) {
        const b = await tx.smartBucket.findFirst({
          where: { id: bucketId, userId, isActive: true },
        });
        if (!b) throw new Error('BUCKET_NOT_FOUND');
      } else if (body.createBucket !== false) {
        const slug = body.name.trim().slice(0, 80) || 'Goal fund';
        const bucket = await tx.smartBucket.create({
          data: {
            userId,
            name: slug,
            type: GOAL_FUND_BUCKET_TYPE,
            targetAmount: body.targetAmount,
            currentAmount: 0,
            isActive: true,
          },
        });
        bucketId = bucket.id;
      }

      if (!bucketId) {
        throw new Error('BUCKET_REQUIRED');
      }

      return tx.operationalGoal.create({
        data: {
          userId,
          name: body.name.trim(),
          description: body.description?.trim() ?? null,
          goalKind: body.goalKind,
          targetAmount: body.targetAmount,
          targetDate: body.targetDate ? new Date(body.targetDate) : null,
          smartBucketId: bucketId,
          automationMode: body.automationMode ?? GoalAutomationMode.MANUAL_ONLY,
          automationConfig:
            body.automationConfig === null || body.automationConfig === undefined
              ? undefined
              : (body.automationConfig as Prisma.InputJsonValue),
          priority: body.priority ?? 100,
          status: OperationalGoalStatus.ACTIVE,
        },
        include: { smartBucket: true },
      });
    })) as GoalWithBucket;
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    if (msg === 'BUCKET_NOT_FOUND') {
      return NextResponse.json({ error: 'Bucket not found' }, { status: 404 });
    }
    if (msg === 'BUCKET_REQUIRED') {
      return NextResponse.json(
        { error: 'Provide smartBucketId or allow createBucket (default true).' },
        { status: 400 }
      );
    }
    console.error('[goals/operational POST]', err);
    return NextResponse.json({ error: 'Could not create goal' }, { status: 500 });
  }

  if (!createdGoal) {
    return NextResponse.json({ error: 'Could not create goal' }, { status: 500 });
  }

  await createFinancialEventSafe({
    userId,
    type: FinancialEventType.GOAL_CREATED,
    source: FinancialEventSource.API_GOALS,
    relatedEntityType: FinancialEntityType.OPERATIONAL_GOAL,
    relatedEntityId: createdGoal.id,
    metadata: {
      goalKind: createdGoal.goalKind,
      targetAmount: createdGoal.targetAmount,
      bucketId: createdGoal.smartBucketId,
    },
  });

  return NextResponse.json({ goal: createdGoal });
}
