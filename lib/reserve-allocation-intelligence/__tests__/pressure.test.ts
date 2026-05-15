import {
  GoalAutomationMode,
  OperationalGoalKind,
  OperationalGoalStatus,
} from '@prisma/client';
import type { OperationalGoal, SmartBucket } from '@prisma/client';
import type { CashFlowForecastResponseDto } from '@/lib/cashflow/types';
import type { ContractorFinancialOpsSnapshotDto } from '@/lib/contractor-operations/types';
import {
  buildReserveAllocationGuidance,
  buildReservePressureFactors,
  countReserveGoalsUnderHalf,
  reservePressureScore,
  selectTopUnderfilledReserveGoals,
} from '@/lib/reserve-allocation-intelligence/pressure';
import { isElevatedReservePressure } from '@/lib/reserve-allocation-intelligence/snapshot';
import {
  computeDiscretionaryOutflowStats,
  DISCRETIONARY_LOOKBACK_DAYS,
  type DiscretionaryOutflowStatsDto,
} from '@/lib/reserve-allocation-intelligence/discretionary';

function emptyContractor(): ContractorFinancialOpsSnapshotDto {
  return {
    generatedAt: new Date().toISOString(),
    hasContractorContext: false,
    jobsSample: [],
    materialExposure: [],
    negativeMarginJobs: [],
    openReceivables: [],
    receivableConcentration: {
      openInvoiceCount: 0,
      totalOpenUsd: 0,
      herfindahlIndex: 0,
      topClients: [],
      reasoning: [],
    },
    latePayerClients: [],
    collectionTiming: {
      windowDays: 14,
      upcomingWithinWindowCount: 0,
      meanDaysUntilDue: null,
      stdevDaysUntilDue: null,
      reasoning: [],
    },
    reserveNudges: [],
    forecastRiskCodes: [],
    explain: { assumptions: [], inputsUsed: {} },
  };
}

function emptyDiscretionary(): DiscretionaryOutflowStatsDto {
  return {
    lookbackDays: DISCRETIONARY_LOOKBACK_DAYS,
    sampleSize: 0,
    totalOutflowUsd: 0,
    discretionaryOutflowUsd: 0,
    discretionaryShare: 0,
    topDiscretionaryCategories: [],
  };
}

function baseForecast(overrides: Partial<CashFlowForecastResponseDto> = {}): CashFlowForecastResponseDto {
  return {
    generatedAt: new Date().toISOString(),
    windows: [
      {
        windowDays: 30,
        startingBalance: 5000,
        projectedEndingBalance: 4000,
        lowestProjectedBalance: 800,
        lowestProjectedBalanceDate: null,
        expectedIncomeTotal: 0,
        expectedBillsTotal: 2000,
        expectedAllocationImpactTotal: 300,
        riskLevel: 'medium',
        events: [],
      },
    ],
    recurringObligations: [],
    recurringIncome: [],
    risks: [],
    explain: {
      assumptions: [],
      inputsUsed: { weeklyAllocationEstimateUsd: '100.00' },
      confidence: 'medium',
    },
    ...overrides,
  };
}

function buildGoal(overrides: Partial<OperationalGoal & { smartBucket: SmartBucket }>): OperationalGoal & {
  smartBucket: SmartBucket;
} {
  return {
    id: overrides.id ?? 'g',
    userId: 'u',
    name: overrides.name ?? 'Goal',
    description: null,
    goalKind: overrides.goalKind ?? OperationalGoalKind.EMERGENCY_FUND,
    targetAmount: overrides.targetAmount ?? 1000,
    targetDate: null,
    smartBucketId: 'b',
    automationMode: GoalAutomationMode.MANUAL_ONLY,
    automationConfig: null,
    priority: 100,
    status: overrides.status ?? OperationalGoalStatus.ACTIVE,
    lastContributionAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    smartBucket: {
      id: 'b',
      userId: 'u',
      name: 'bucket',
      type: 'goal',
      targetAmount: null,
      currentAmount: overrides.smartBucket?.currentAmount ?? 100,
      color: null,
      icon: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides.smartBucket,
    },
  };
}

describe('buildReservePressureFactors', () => {
  it('counts allocation pressure and active automation rules', () => {
    const forecast = baseForecast({
      risks: [
        {
          code: 'ALLOCATION_PRESSURE',
          severity: 'info',
          summary: 'alloc',
          detail: 'detail',
          confidence: 0.5,
        },
      ],
    });
    const factors = buildReservePressureFactors({
      forecast,
      contractor: emptyContractor(),
      goals: [],
      enabledAllocationRuleCount: 2,
      discretionaryOutflowStats: emptyDiscretionary(),
    });
    const codes = factors.map(f => f.code);
    expect(codes).toContain('ALLOCATION_PRESSURE');
    expect(codes).toContain('AUTOMATION_ALLOCATION_ACTIVE');
    expect(reservePressureScore(factors)).toBe(factors.length);
  });

  it('flags reserve goals under half target', () => {
    const goal = buildGoal({
      id: 'g1',
      name: 'E',
      goalKind: OperationalGoalKind.EMERGENCY_FUND,
      targetAmount: 1000,
      smartBucket: {
        id: 'b1',
        userId: 'u',
        name: 'bucket',
        type: 'goal',
        targetAmount: null,
        currentAmount: 100,
        color: null,
        icon: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    const factors = buildReservePressureFactors({
      forecast: baseForecast(),
      contractor: emptyContractor(),
      goals: [goal],
      enabledAllocationRuleCount: 0,
      discretionaryOutflowStats: emptyDiscretionary(),
    });
    expect(factors.some(f => f.code === 'RESERVE_GOALS_UNDER_HALF')).toBe(true);
    expect(countReserveGoalsUnderHalf([goal])).toBe(1);
  });

  it('does not fire DISCRETIONARY_SPEND_PRESSURE without a gating factor', () => {
    const stats: DiscretionaryOutflowStatsDto = {
      lookbackDays: DISCRETIONARY_LOOKBACK_DAYS,
      sampleSize: 10,
      totalOutflowUsd: 1000,
      discretionaryOutflowUsd: 800,
      discretionaryShare: 0.8,
      topDiscretionaryCategories: [{ name: 'Dining', usd: 800 }],
    };
    const factors = buildReservePressureFactors({
      forecast: baseForecast(),
      contractor: emptyContractor(),
      goals: [],
      enabledAllocationRuleCount: 0,
      discretionaryOutflowStats: stats,
    });
    expect(factors.some(f => f.code === 'DISCRETIONARY_SPEND_PRESSURE')).toBe(false);
  });

  it('fires DISCRETIONARY_SPEND_PRESSURE only when gated by an existing pressure factor', () => {
    const stats: DiscretionaryOutflowStatsDto = {
      lookbackDays: DISCRETIONARY_LOOKBACK_DAYS,
      sampleSize: 10,
      totalOutflowUsd: 1000,
      discretionaryOutflowUsd: 500,
      discretionaryShare: 0.5,
      topDiscretionaryCategories: [{ name: 'Dining', usd: 300 }, { name: 'Shopping', usd: 200 }],
    };
    const factors = buildReservePressureFactors({
      forecast: baseForecast({
        risks: [
          {
            code: 'PROJECTED_LOW_BALANCE',
            severity: 'warning',
            summary: 'low',
            detail: 'low balance projection',
            confidence: 0.8,
          },
        ],
      }),
      contractor: emptyContractor(),
      goals: [],
      enabledAllocationRuleCount: 0,
      discretionaryOutflowStats: stats,
    });
    const codes = factors.map(f => f.code);
    expect(codes).toContain('PROJECTED_LOW_BALANCE_WARNING');
    expect(codes).toContain('DISCRETIONARY_SPEND_PRESSURE');
  });
});

describe('buildReserveAllocationGuidance', () => {
  it('emits automation review when allocation pressure present', () => {
    const g = buildReserveAllocationGuidance([
      { code: 'ALLOCATION_PRESSURE', summary: '', reasoning: [] },
    ]);
    expect(g.some(x => x.code === 'REVIEW_DISCRETIONARY_AUTOMATION')).toBe(true);
  });

  it('emits TRIM_DISCRETIONARY_OUTFLOWS when discretionary spend pressure is present', () => {
    const g = buildReserveAllocationGuidance([
      { code: 'PROJECTED_LOW_BALANCE_WARNING', summary: '', reasoning: [] },
      { code: 'DISCRETIONARY_SPEND_PRESSURE', summary: '', reasoning: [] },
    ]);
    expect(g.some(x => x.code === 'TRIM_DISCRETIONARY_OUTFLOWS')).toBe(true);
  });
});

describe('selectTopUnderfilledReserveGoals', () => {
  it('returns lowest-progress reserve goals first and ignores non-reserve kinds', () => {
    const g1 = buildGoal({
      id: 'g1',
      name: 'Emergency',
      goalKind: OperationalGoalKind.EMERGENCY_FUND,
      targetAmount: 1000,
      smartBucket: { currentAmount: 100 } as SmartBucket,
    });
    const g2 = buildGoal({
      id: 'g2',
      name: 'Tax',
      goalKind: OperationalGoalKind.TAX_RESERVE,
      targetAmount: 1000,
      smartBucket: { currentAmount: 300 } as SmartBucket,
    });
    const g3 = buildGoal({
      id: 'g3',
      name: 'Vacation',
      goalKind: OperationalGoalKind.VACATION,
      targetAmount: 1000,
      smartBucket: { currentAmount: 10 } as SmartBucket,
    });
    const result = selectTopUnderfilledReserveGoals([g1, g2, g3], 3);
    expect(result.map(r => r.goalId)).toEqual(['g1', 'g2']);
    expect(result[0]?.progress).toBeLessThan(result[1]?.progress ?? 1);
  });
});

describe('isElevatedReservePressure', () => {
  it('is true when critical low balance', () => {
    expect(isElevatedReservePressure({ factorsLen: 1, hasCriticalLowBalance: true })).toBe(true);
  });
  it('is true when score meets threshold', () => {
    expect(isElevatedReservePressure({ factorsLen: 4, hasCriticalLowBalance: false })).toBe(true);
  });
  it('is false when below threshold and not critical', () => {
    expect(isElevatedReservePressure({ factorsLen: 3, hasCriticalLowBalance: false })).toBe(false);
  });
});

describe('computeDiscretionaryOutflowStats', () => {
  it('computes share and top categories from a known fixture', () => {
    const stats = computeDiscretionaryOutflowStats(
      [
        { categoryName: 'Dining out', subcategory: null, amount: 120 },
        { categoryName: 'Groceries', subcategory: null, amount: 200 },
        { categoryName: null, subcategory: 'Streaming services', amount: 30 },
        { categoryName: 'Shopping', subcategory: null, amount: 50 },
      ]
    );
    expect(stats.totalOutflowUsd).toBe(400);
    expect(stats.discretionaryOutflowUsd).toBe(200);
    expect(stats.discretionaryShare).toBeCloseTo(0.5, 4);
    expect(stats.topDiscretionaryCategories.map(c => c.name)).toEqual([
      'Dining out',
      'Shopping',
      'Streaming services',
    ]);
  });

  it('handles empty input', () => {
    const stats = computeDiscretionaryOutflowStats([]);
    expect(stats.totalOutflowUsd).toBe(0);
    expect(stats.discretionaryShare).toBe(0);
    expect(stats.topDiscretionaryCategories).toEqual([]);
  });
});
