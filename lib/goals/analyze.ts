import { addDays, differenceInCalendarDays, startOfDay } from 'date-fns';
import type { OperationalGoal, SmartBucket } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { goalAllocationSource } from '@/lib/goals/constants';
import type { GoalAnalysisDto, GoalAnalysisFinding, GoalAnalyzeContext } from '@/lib/goals/types';

const DEFAULT_HORIZON_DAYS = 90;
const PACE_TOLERANCE = 0.85;
const PRESSURE_RATIO = 1.22;

function window30d(forecast: GoalAnalyzeContext['forecast']) {
  return forecast.windows.find(w => w.windowDays === 30) ?? forecast.windows[forecast.windows.length - 1];
}

/**
 * Deterministic goal analysis: pace, deadline feasibility, forecast pressure.
 * All numbers are reproducible from bucket balance, allocation history, and `buildCashFlowForecast` output.
 */
export async function analyzeOperationalGoal(
  userId: string,
  goal: OperationalGoal & { smartBucket: SmartBucket },
  ctx: GoalAnalyzeContext
): Promise<GoalAnalysisDto> {
  const now = startOfDay(new Date());
  const currentProgress = Math.min(goal.smartBucket.currentAmount, goal.targetAmount);
  const remaining = Math.max(0, goal.targetAmount - currentProgress);

  const targetDay = goal.targetDate ? startOfDay(goal.targetDate) : addDays(now, DEFAULT_HORIZON_DAYS);
  const daysRemaining = Math.max(1, differenceInCalendarDays(targetDay, now));

  const requiredAverageDaily = remaining / daysRemaining;

  const since = addDays(now, -30);
  const agg = await prisma.smartAllocation.aggregate({
    where: {
      userId,
      source: goalAllocationSource(goal.id),
      createdAt: { gte: since },
    },
    _sum: { amount: true },
  });
  const sum30 = agg._sum.amount ?? 0;
  const trailing30DayAverageDailyContribution = sum30 / 30;

  const w30 = window30d(ctx.forecast);
  const forecastDailyAllocationDrag30d =
    w30 && w30.windowDays > 0 ? w30.expectedAllocationImpactTotal / w30.windowDays : null;

  let projectedCompletionDate: string | null = null;
  if (trailing30DayAverageDailyContribution > 0.01 && remaining > 0) {
    const daysToComplete = Math.ceil(remaining / trailing30DayAverageDailyContribution);
    projectedCompletionDate = addDays(now, daysToComplete).toISOString();
  }

  const findings: GoalAnalysisFinding[] = [];
  const summaryExplain: string[] = [
    `Progress $${currentProgress.toFixed(2)} of $${goal.targetAmount.toFixed(2)} in bucket "${goal.smartBucket.name}".`,
    `Remaining $${remaining.toFixed(2)} over ${daysRemaining} day(s) ⇒ required ~$${requiredAverageDaily.toFixed(2)}/day.`,
    `Trailing 30d average contribution from this goal: ~$${trailing30DayAverageDailyContribution.toFixed(2)}/day (from SmartAllocation rows with source ${goalAllocationSource(goal.id)}).`,
  ];

  if (forecastDailyAllocationDrag30d != null) {
    summaryExplain.push(
      `Cash flow model allocation impact (~30d window): ~$${forecastDailyAllocationDrag30d.toFixed(2)}/day drag on liquid balance (see Cash Flow explain payload for bill/income inputs).`
    );
  }

  if (remaining > 5 && trailing30DayAverageDailyContribution < requiredAverageDaily * PACE_TOLERANCE) {
    findings.push({
      code: 'MISSED_TARGET_PACE',
      severity: 'warning',
      title: 'Goal is behind required pace',
      detail: `At your recent contribution rate you are unlikely to reach $${goal.targetAmount.toFixed(2)} by ${targetDay.toISOString().slice(0, 10)} unless you increase contributions or move the target date.`,
      explain: [
        `Required average at least $${requiredAverageDaily.toFixed(2)}/day for ${daysRemaining} day(s).`,
        `Observed ~$${trailing30DayAverageDailyContribution.toFixed(2)}/day over the last 30 days from goal-linked allocations.`,
      ],
    });
  }

  if (
    forecastDailyAllocationDrag30d != null &&
    requiredAverageDaily > forecastDailyAllocationDrag30d * PRESSURE_RATIO
  ) {
    findings.push({
      code: 'ALLOCATION_PRESSURE_CONFLICT',
      severity: 'warning',
      title: 'Goal pace may conflict with existing allocation pressure',
      detail:
        'Your cash flow forecast already applies steady envelope allocation drag. This goal’s required daily pace is materially higher than that drag, which may strain liquid balances unless income rises or other envelopes shrink.',
      explain: [
        `Goal requires ~$${requiredAverageDaily.toFixed(2)}/day.`,
        `Forecasted allocation impact ~$${forecastDailyAllocationDrag30d.toFixed(2)}/day (30d window, deterministic model).`,
      ],
    });
  }

  const lowBal = ctx.forecast.risks.find(
    r => r.code === 'PROJECTED_LOW_BALANCE' || r.code === 'ALLOCATION_PRESSURE'
  );
  if (lowBal && requiredAverageDaily > 0 && remaining > 5) {
    findings.push({
      code: 'FORECAST_LOW_BALANCE_WITH_GOAL_DEMAND',
      severity: lowBal.severity === 'critical' ? 'critical' : 'warning',
      title: 'Forecast risk overlaps with active goal demand',
      detail: `${lowBal.summary} — combined with this goal’s remaining $${remaining.toFixed(2)}, consider pausing contributions or reprioritizing envelopes.`,
      explain: [lowBal.detail, ...summaryExplain.slice(0, 2)],
    });
  }

  return {
    goalId: goal.id,
    currentProgress,
    targetAmount: goal.targetAmount,
    remaining,
    targetDate: goal.targetDate ? goal.targetDate.toISOString() : null,
    daysRemaining,
    requiredAverageDaily,
    trailing30DayAverageDailyContribution,
    forecastDailyAllocationDrag30d,
    projectedCompletionDate,
    findings,
    summaryExplain,
  };
}
