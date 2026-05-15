import type { Prisma } from '@prisma/client';
import {
  AutomationNotificationType,
  FinancialEntityType,
  FinancialEventSource,
  FinancialEventType,
  NotificationSeverity,
  OperationalGoalStatus,
} from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { buildCashFlowForecast } from '@/lib/cashflow/forecast';
import { createAutomationNotification } from '@/lib/financial-automation/rules-engine';
import { buildOperationalAttentionMetadata } from '@/lib/financial-automation/actionable-metadata';
import { analyzeOperationalGoal } from '@/lib/goals/analyze';
import { createFinancialEventSafe } from '@/lib/financial-events/events';
import type { GoalAnalysisFinding } from '@/lib/goals/types';

/** Exported for derived-attention reconciliation (keep in sync with upsert keys). */
export function mapFindingToNotification(f: GoalAnalysisFinding): {
  type: AutomationNotificationType;
  kind: string;
} {
  switch (f.code) {
    case 'MISSED_TARGET_PACE':
      return { type: AutomationNotificationType.GOAL_PACE_WARNING, kind: 'goal_pace_warning' };
    case 'ALLOCATION_PRESSURE_CONFLICT':
      return { type: AutomationNotificationType.GOAL_UNSAFE_CONTRIBUTION, kind: 'goal_unsafe_contribution' };
    case 'FORECAST_LOW_BALANCE_WITH_GOAL_DEMAND':
      return { type: AutomationNotificationType.GOAL_FORECAST_CONFLICT, kind: 'goal_forecast_conflict' };
    default:
      return { type: AutomationNotificationType.GOAL_PACE_WARNING, kind: 'goal_generic' };
  }
}

function buildMeta(
  goalId: string,
  attentionKind: string,
  f: GoalAnalysisFinding
): Prisma.InputJsonValue {
  const base = buildOperationalAttentionMetadata(
    [
      { type: 'OPEN_OPERATIONAL_GOAL', goalId },
      { type: 'OPEN_CASH_FLOW' },
    ],
    {
      attentionKind,
      trust: {
        why: f.explain.join(' '),
        whatChanged: f.detail,
        recommendedNextStep: f.detail,
        sourceEventType: 'GOAL_RISK_EVALUATED',
      },
    }
  ) as Record<string, unknown>;

  return {
    ...base,
    goalPlanning: {
      findingCode: f.code,
      reasoningLines: f.explain,
    },
  } as Prisma.InputJsonValue;
}

/**
 * Idempotent operational alerts for active goals (deterministic analysis).
 */
export async function ensureGoalPlanningAttentionNotifications(userId: string): Promise<void> {
  const goals = await prisma.operationalGoal.findMany({
    where: { userId, status: OperationalGoalStatus.ACTIVE },
    include: { smartBucket: true },
    orderBy: [{ priority: 'asc' }, { createdAt: 'asc' }],
  });

  if (goals.length === 0) return;

  const forecast = await buildCashFlowForecast(userId, { includeDetails: false });

  for (const goal of goals) {
    const analysis = await analyzeOperationalGoal(userId, goal, { forecast });

    for (const f of analysis.findings) {
      const { type, kind } = mapFindingToNotification(f);
      const attentionKind = `${kind}_${goal.id}`;
      const metaFinal = buildMeta(goal.id, attentionKind, f);

      const existing = await prisma.automationNotification.findFirst({
        where: {
          userId,
          relatedEntityType: FinancialEntityType.OPERATIONAL_GOAL,
          relatedEntityId: goal.id,
          metadata: { path: ['attentionKind'], equals: attentionKind },
        },
        select: { id: true },
      });

      const severity =
        f.severity === 'critical'
          ? NotificationSeverity.CRITICAL
          : f.severity === 'warning'
            ? NotificationSeverity.WARNING
            : NotificationSeverity.INFO;

      if (existing) {
        await prisma.automationNotification.update({
          where: { id: existing.id },
          data: {
            type,
            severity,
            title: f.title,
            body: f.detail,
            metadata: metaFinal,
          },
        });
      } else {
        await createAutomationNotification({
          userId,
          type,
          severity,
          title: f.title,
          body: f.detail,
          relatedEntityType: FinancialEntityType.OPERATIONAL_GOAL,
          relatedEntityId: goal.id,
          metadata: metaFinal,
        });

        await createFinancialEventSafe({
          userId,
          type: FinancialEventType.GOAL_RISK_EVALUATED,
          source: FinancialEventSource.API_GOALS,
          relatedEntityType: FinancialEntityType.OPERATIONAL_GOAL,
          relatedEntityId: goal.id,
          metadata: { findingCode: f.code, attentionKind },
        });
      }
    }
  }
}

export function fullGoalAttentionKind(goalId: string, f: GoalAnalysisFinding): string {
  const { kind } = mapFindingToNotification(f);
  return `${kind}_${goalId}`;
}
