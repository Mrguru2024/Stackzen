import { addDays } from 'date-fns';
import type { OperationalGoal, SmartBucket } from '@prisma/client';
import { AutomationRuleType, NotificationSeverity, OperationalGoalStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { buildCashFlowForecast } from '@/lib/cashflow/forecast';
import { analyzeOperationalGoal } from '@/lib/goals/analyze';
import type { OperationalActionProposalRow } from '@/lib/operational-actions/types';
import {
  fingerprintForExtendGoal,
  fingerprintForGoalContribution,
  fingerprintForPauseRule,
} from '@/lib/operational-actions/fingerprint';

const MAX_PROPOSALS = 5;

function suggestedCatchUpAmount(requiredDaily: number, remaining: number): number {
  const weekly = requiredDaily * 7;
  const raw = Math.min(500, Math.max(25, Math.round(weekly * 100) / 100));
  return Math.min(raw, Math.max(25, Math.round(remaining * 100) / 100));
}

/**
 * Deterministic operational financial proposals (no autonomous execution).
 */
export async function buildOperationalActionProposalRows(userId: string): Promise<OperationalActionProposalRow[]> {
  const forecast = await buildCashFlowForecast(userId, { includeDetails: false });
  const riskCodes = forecast.risks.map(r => r.code);
  const rows: OperationalActionProposalRow[] = [];

  const hasAllocPressure = riskCodes.includes('ALLOCATION_PRESSURE');
  if (hasAllocPressure) {
    const rule = await prisma.automationRule.findFirst({
      where: { userId, enabled: true, type: AutomationRuleType.ALLOCATION },
      orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
    });
    if (rule) {
      const fp = fingerprintForPauseRule({
        forecastGeneratedAt: forecast.generatedAt,
        riskCodes,
        ruleId: rule.id,
      });
      rows.push({
        attentionKind: `operational_action_pause_rule_${rule.id}`,
        title: 'Suggested action · Pause an allocation rule',
        body: `Pause "${rule.name}" to reduce modeled daily allocation drag while ${riskCodes.join(', ')} is active. You must explicitly approve — nothing runs automatically.`,
        severity: NotificationSeverity.WARNING,
        proposal: {
          version: 1,
          status: 'pending',
          kind: 'PAUSE_AUTOMATION_RULE',
          fingerprint: fp,
          lastForecastGeneratedAt: forecast.generatedAt,
          payload: { ruleId: rule.id, ruleName: rule.name },
          explain: {
            why: 'Cash flow risk ALLOCATION_PRESSURE is present in the deterministic 30d projection.',
            dataInfluences: [
              'buildCashFlowForecast → analyzeRisks',
              'AutomationRule rows (ALLOCATION, enabled)',
            ],
            calculations: [
              'Selected enabled ALLOCATION rule with highest numeric priority value (discretionary ordering).',
            ],
            expectedImpact:
              'Pausing removes this rule from future automation evaluation until you re-enable it; next Cash Flow run should show lower allocation drag if this rule was contributing materially.',
          },
        },
      });
    }
  }

  const goals = await prisma.operationalGoal.findMany({
    where: { userId, status: OperationalGoalStatus.ACTIVE },
    include: { smartBucket: true },
    orderBy: [{ priority: 'asc' }, { createdAt: 'asc' }],
  });

  type GoalRow = OperationalGoal & { smartBucket: SmartBucket };
  const scored: { goal: GoalRow; deficit: number; analysis: Awaited<ReturnType<typeof analyzeOperationalGoal>> }[] = [];

  for (const g of goals as GoalRow[]) {
    const analysis = await analyzeOperationalGoal(userId, g, { forecast });
    const missed = analysis.findings.some(f => f.code === 'MISSED_TARGET_PACE');
    if (!missed) continue;
    const deficit = Math.max(0, analysis.requiredAverageDaily - analysis.trailing30DayAverageDailyContribution);
    scored.push({ goal: g, deficit, analysis });
  }
  scored.sort((a, b) => b.deficit - a.deficit);

  const picked = scored.slice(0, 2);
  for (const { goal, analysis } of picked) {
    if (rows.length >= MAX_PROPOSALS) break;
    const remaining = Math.max(0, analysis.targetAmount - analysis.currentProgress);
    const suggested = suggestedCatchUpAmount(analysis.requiredAverageDaily, remaining);
    if (suggested >= 25 && remaining >= 25) {
      const fp = fingerprintForGoalContribution({
        forecastGeneratedAt: forecast.generatedAt,
        goalId: goal.id,
        suggestedAmount: suggested.toFixed(2),
      });
      rows.push({
        attentionKind: `operational_action_goal_contribution_${goal.id}`,
        title: `Suggested action · Catch-up contribution · ${goal.name}`,
        body: `Voluntarily allocate $${suggested.toFixed(2)} into bucket "${goal.smartBucket.name}" to narrow the pace gap (remaining $${remaining.toFixed(2)}). Requires explicit approval.`,
        severity: NotificationSeverity.WARNING,
        proposal: {
          version: 1,
          status: 'pending',
          kind: 'RECORD_GOAL_CONTRIBUTION',
          fingerprint: fp,
          lastForecastGeneratedAt: forecast.generatedAt,
          payload: {
            goalId: goal.id,
            goalName: goal.name,
            suggestedAmount: suggested,
            bucketId: goal.smartBucketId,
            bucketName: goal.smartBucket.name,
            currentBucketAmount: goal.smartBucket.currentAmount,
          },
          explain: {
            why: 'Goal analyzer flagged MISSED_TARGET_PACE vs required average daily funding.',
            dataInfluences: [
              'SmartBucket.currentAmount',
              'SmartAllocation aggregates (goal source)',
              'buildCashFlowForecast windows[30d]',
            ],
            calculations: [
              `Suggested = min(500, max(25, requiredAverageDaily×7)), capped by remaining.`,
              `Required ~$${analysis.requiredAverageDaily.toFixed(2)}/day; trailing ~$${analysis.trailing30DayAverageDailyContribution.toFixed(2)}/day.`,
            ],
            expectedImpact:
              'Creates a SmartAllocation row and increments the linked bucket — auditable the same way as manual contributions from Goals.',
          },
        },
      });
    } else if (goal.targetDate) {
      const prev = goal.targetDate;
      const proposed = addDays(prev, 14);
      const fp = fingerprintForExtendGoal({
        forecastGeneratedAt: forecast.generatedAt,
        goalId: goal.id,
        proposedTargetDate: proposed.toISOString(),
      });
      rows.push({
        attentionKind: `operational_action_extend_goal_${goal.id}`,
        title: `Suggested action · Extend goal deadline · ${goal.name}`,
        body: `Move target date from ${prev.toISOString().slice(0, 10)} to ${proposed.toISOString().slice(0, 10)} to reduce implied daily pace without changing the target amount.`,
        severity: NotificationSeverity.INFO,
        proposal: {
          version: 1,
          status: 'pending',
          kind: 'EXTEND_GOAL_TARGET_DATE',
          fingerprint: fp,
          lastForecastGeneratedAt: forecast.generatedAt,
          payload: {
            goalId: goal.id,
            goalName: goal.name,
            previousTargetDate: prev.toISOString(),
            proposedTargetDate: proposed.toISOString(),
          },
          explain: {
            why: 'Goal is behind pace and the catch-up lump-sum suggestion would be below the minimum operational threshold — timeline extension is offered instead.',
            dataInfluences: ['OperationalGoal.targetDate', 'Goal pace heuristics'],
            calculations: ['Proposed date = previous target date + 14 calendar days.'],
            expectedImpact:
              'Lowers requiredAverageDaily in future analyzer runs; does not move external money — only planning metadata.',
          },
        },
      });
    }
  }

  return rows.slice(0, MAX_PROPOSALS);
}
