import { NextResponse } from 'next/server';
import { z } from 'zod';
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
import { analyzeOperationalGoal } from '@/lib/goals/analyze';
import { buildCashFlowForecast } from '@/lib/cashflow/forecast';

const patchSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional().nullable(),
  goalKind: z.nativeEnum(OperationalGoalKind).optional(),
  targetAmount: z.number().positive().finite().optional(),
  targetDate: z.string().datetime().optional().nullable(),
  automationMode: z.nativeEnum(GoalAutomationMode).optional(),
  automationConfig: z.record(z.unknown()).optional().nullable(),
  priority: z.number().int().min(0).max(1_000_000).optional(),
  status: z.nativeEnum(OperationalGoalStatus).optional(),
});

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireAuthSession();
  if (response) return response;

  const { id } = await context.params;

  const goal = await prisma.operationalGoal.findFirst({
    where: { id, userId: session.user.id },
    include: { smartBucket: true },
  });

  if (!goal) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const forecast = await buildCashFlowForecast(session.user.id, { includeDetails: true });
  const analysis =
    goal.status === OperationalGoalStatus.ACTIVE
      ? await analyzeOperationalGoal(session.user.id, goal, { forecast })
      : null;

  return NextResponse.json({ goal, analysis, forecastExplain: forecast.explain });
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireAuthSession();
  if (response) return response;

  const { id } = await context.params;
  const raw = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload', details: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await prisma.operationalGoal.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const d = parsed.data;
  const updated = await prisma.operationalGoal.update({
    where: { id },
    data: {
      ...(d.name !== undefined ? { name: d.name.trim() } : {}),
      ...(d.description !== undefined ? { description: d.description?.trim() ?? null } : {}),
      ...(d.goalKind !== undefined ? { goalKind: d.goalKind } : {}),
      ...(d.targetAmount !== undefined ? { targetAmount: d.targetAmount } : {}),
      ...(d.targetDate !== undefined
        ? { targetDate: d.targetDate ? new Date(d.targetDate) : null }
        : {}),
      ...(d.automationMode !== undefined ? { automationMode: d.automationMode } : {}),
      ...(d.automationConfig !== undefined
        ? {
            automationConfig:
              d.automationConfig === null
                ? Prisma.JsonNull
                : (d.automationConfig as Prisma.InputJsonValue),
          }
        : {}),
      ...(d.priority !== undefined ? { priority: d.priority } : {}),
      ...(d.status !== undefined ? { status: d.status } : {}),
    },
    include: { smartBucket: true },
  });

  await createFinancialEventSafe({
    userId: session.user.id,
    type: FinancialEventType.GOAL_UPDATED,
    source: FinancialEventSource.API_GOALS,
    relatedEntityType: FinancialEntityType.OPERATIONAL_GOAL,
    relatedEntityId: id,
    metadata: { fields: Object.keys(d) },
  });

  return NextResponse.json({ goal: updated });
}
