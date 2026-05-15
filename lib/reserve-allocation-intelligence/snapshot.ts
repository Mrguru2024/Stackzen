import {
  AutomationRuleType,
  FinancialTransactionDirection,
  OperationalGoalStatus,
} from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { buildCashFlowForecast } from '@/lib/cashflow/forecast';
import { buildContractorFinancialOpsSnapshot } from '@/lib/contractor-operations/snapshot';
import type { ContractorFinancialOpsSnapshotDto } from '@/lib/contractor-operations/types';
import {
  buildReserveAllocationGuidance,
  buildReservePressureFactors,
  countReserveGoalsUnderHalf,
  reservePressureScore,
  selectTopUnderfilledReserveGoals,
} from '@/lib/reserve-allocation-intelligence/pressure';
import {
  DISCRETIONARY_LOOKBACK_DAYS,
  computeDiscretionaryOutflowStats,
  type DiscretionaryTxRow,
} from '@/lib/reserve-allocation-intelligence/discretionary';
import type { ReserveAllocationSnapshotDto } from '@/lib/reserve-allocation-intelligence/types';
import { buildTimingCoordinationSnapshotFromForecast } from '@/lib/timing-coordination/snapshot';
import type { TimingCoordinationSnapshotDto } from '@/lib/timing-coordination/types';

const ELEVATED_SCORE_THRESHOLD = 4;
const ALLOCATION_RULE_SAMPLE = 6;
const SAVINGS_RULE_SAMPLE = 6;

export function isElevatedReservePressure(params: {
  factorsLen: number;
  hasCriticalLowBalance: boolean;
}): boolean {
  return params.hasCriticalLowBalance || params.factorsLen >= ELEVATED_SCORE_THRESHOLD;
}

export interface ReserveAndContractorIntelligenceBundle {
  reserve: ReserveAllocationSnapshotDto;
  contractor: ContractorFinancialOpsSnapshotDto;
  timing: TimingCoordinationSnapshotDto;
}

/**
 * Single forecast + contractor snapshot for hub ensures (avoids duplicate `buildCashFlowForecast` / contractor queries).
 */
export async function buildReserveAndContractorIntelligenceBundle(
  userId: string
): Promise<ReserveAndContractorIntelligenceBundle> {
  // includeDetails=true so the timing-coordination snapshot can detect the
  // instability window from the 30-day daily series without a second forecast.
  const forecast = await buildCashFlowForecast(userId, { includeDetails: true });

  const discretionarySince = new Date();
  discretionarySince.setUTCDate(discretionarySince.getUTCDate() - DISCRETIONARY_LOOKBACK_DAYS);

  const [
    contractor,
    goals,
    enabledAllocationRuleCount,
    enabledAllocationRulesSample,
    enabledSavingsRuleCount,
    totalSavingsRuleCount,
    enabledSavingsRulesSample,
    discretionaryRows,
  ] = await Promise.all([
    buildContractorFinancialOpsSnapshot(userId, { forecast }),
    prisma.operationalGoal.findMany({
      where: { userId, status: OperationalGoalStatus.ACTIVE },
      include: { smartBucket: true },
    }),
    prisma.automationRule.count({
      where: { userId, enabled: true, type: AutomationRuleType.ALLOCATION },
    }),
    prisma.automationRule.findMany({
      where: { userId, enabled: true, type: AutomationRuleType.ALLOCATION },
      select: { id: true, name: true, priority: true },
      orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
      take: ALLOCATION_RULE_SAMPLE,
    }),
    prisma.savingsRule.count({ where: { userId, isActive: true } }),
    prisma.savingsRule.count({ where: { userId } }),
    prisma.savingsRule.findMany({
      where: { userId, isActive: true },
      select: { id: true, name: true, type: true },
      orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
      take: SAVINGS_RULE_SAMPLE,
    }),
    prisma.financialTransaction.findMany({
      where: {
        userId,
        direction: FinancialTransactionDirection.OUTFLOW,
        isTransfer: false,
        postedAt: { gte: discretionarySince },
      },
      select: { amount: true, categoryName: true, subcategory: true },
    }),
  ]);

  const discretionaryOutflowStats = computeDiscretionaryOutflowStats(
    discretionaryRows as DiscretionaryTxRow[],
    DISCRETIONARY_LOOKBACK_DAYS
  );

  const factors = buildReservePressureFactors({
    forecast,
    contractor,
    goals,
    enabledAllocationRuleCount,
    discretionaryOutflowStats,
  });
  const score = reservePressureScore(factors);
  const guidance = buildReserveAllocationGuidance(factors);
  const reserveGoalUnderfillCount = countReserveGoalsUnderHalf(goals);
  const topUnderfilledReserveGoals = selectTopUnderfilledReserveGoals(goals);

  const wRaw = forecast.explain.inputsUsed.weeklyAllocationEstimateUsd;
  const weeklyAllocationEstimateUsd =
    typeof wRaw === 'string'
      ? Number.parseFloat(wRaw)
      : typeof wRaw === 'number'
        ? wRaw
        : Number.NaN;
  const weeklySafe = Number.isFinite(weeklyAllocationEstimateUsd) ? weeklyAllocationEstimateUsd : 0;

  const hasCriticalLowBalance = forecast.risks.some(
    r => r.code === 'PROJECTED_LOW_BALANCE' && r.severity === 'critical'
  );

  const explain = {
    assumptions: [
      'Pressure factors are a union of binary checks — pressureScore equals the count of active factors, not a weighted health index.',
      'Forecast and allocation drag come solely from buildCashFlowForecast.',
      'Contractor signals reuse buildContractorFinancialOpsSnapshot with the same forecast instance.',
      'Reserve goal progress uses OperationalGoal + SmartBucket canonical balances.',
      'enabledAllocationRulesSample lists highest-priority rules only; it does not re-run the forecast with edited percentages.',
      'SavingsRule context is a read-only enumeration of a separate automation surface — never merged into the AutomationRule allocation count.',
      'discretionaryOutflowStats uses an explicit pattern list over FinancialTransaction OUTFLOW + non-transfer rows; no hidden category flag is introduced.',
      'DISCRETIONARY_SPEND_PRESSURE is gated by an existing low-balance / allocation / timing factor — it never fires on its own.',
      'topUnderfilledReserveGoals are sorted lowest progress first; ties broken by name then id for stable output.',
    ],
    inputsUsed: {
      forecastGeneratedAt: forecast.generatedAt,
      factorCount: score,
      elevatedThreshold: ELEVATED_SCORE_THRESHOLD,
      elevatedAttention: isElevatedReservePressure({ factorsLen: score, hasCriticalLowBalance }),
      weeklyAllocationEstimateUsd: weeklySafe,
      enabledAllocationRuleCount,
      allocationRuleSampleSize: enabledAllocationRulesSample.length,
      enabledSavingsRuleCount,
      totalSavingsRuleCount,
      savingsRuleSampleSize: enabledSavingsRulesSample.length,
      reserveGoalUnderfillCount,
      topUnderfilledReserveGoalCount: topUnderfilledReserveGoals.length,
      activeGoalRows: goals.length,
      contractorContext: contractor.hasContractorContext,
      discretionaryLookbackDays: discretionaryOutflowStats.lookbackDays,
      discretionarySampleSize: discretionaryOutflowStats.sampleSize,
      discretionaryShare: discretionaryOutflowStats.discretionaryShare,
    },
  };

  const reserve: ReserveAllocationSnapshotDto = {
    generatedAt: new Date().toISOString(),
    pressureScore: score,
    factors,
    guidance,
    weeklyAllocationEstimateUsd: weeklySafe,
    enabledAllocationRuleCount,
    enabledAllocationRulesSample: enabledAllocationRulesSample.map(r => ({
      id: r.id,
      name: r.name,
      priority: r.priority,
    })),
    reserveGoalUnderfillCount,
    topUnderfilledReserveGoals,
    discretionaryOutflowStats,
    savingsRulesContext: {
      enabledCount: enabledSavingsRuleCount,
      totalCount: totalSavingsRuleCount,
      sample: enabledSavingsRulesSample.map(r => ({ id: r.id, name: r.name, type: r.type })),
    },
    explain,
  };

  const timing = await buildTimingCoordinationSnapshotFromForecast({
    userId,
    forecast,
    contractor,
  });

  return { reserve, contractor, timing };
}

export async function buildReserveAllocationSnapshot(userId: string): Promise<ReserveAllocationSnapshotDto> {
  const { reserve } = await buildReserveAndContractorIntelligenceBundle(userId);
  return reserve;
}
