import type { OperationalGoal, SmartBucket } from '@prisma/client';
import { OperationalGoalKind, OperationalGoalStatus } from '@prisma/client';
import type { CashFlowForecastResponseDto } from '@/lib/cashflow/types';
import type { ContractorFinancialOpsSnapshotDto } from '@/lib/contractor-operations/types';
import type {
  ReserveAllocationGuidanceRowDto,
  ReserveGoalUnderfillDto,
  ReservePressureFactorDto,
} from '@/lib/reserve-allocation-intelligence/types';
import {
  DISCRETIONARY_PRESSURE_THRESHOLD,
  isDiscretionaryPressure,
  type DiscretionaryOutflowStatsDto,
} from '@/lib/reserve-allocation-intelligence/discretionary';

const RESERVE_PROGRESS_KINDS: OperationalGoalKind[] = [
  OperationalGoalKind.EMERGENCY_FUND,
  OperationalGoalKind.TAX_RESERVE,
  OperationalGoalKind.BUSINESS_RESERVE,
  OperationalGoalKind.RUNWAY,
];

const RESERVE_UNDERFILL_THRESHOLD = 0.5;
const TOP_UNDERFILL_LIMIT = 3;

export interface ReservePressureBuildInput {
  forecast: CashFlowForecastResponseDto;
  contractor: ContractorFinancialOpsSnapshotDto;
  goals: (OperationalGoal & { smartBucket: SmartBucket })[];
  enabledAllocationRuleCount: number;
  discretionaryOutflowStats: DiscretionaryOutflowStatsDto;
}

function pushDeduped(out: ReservePressureFactorDto[], seen: Set<string>, factor: ReservePressureFactorDto) {
  if (seen.has(factor.code)) return;
  seen.add(factor.code);
  out.push(factor);
}

/**
 * Deterministic reserve / allocation pressure factors. `pressureScore` === factors.length.
 * Each factor is a binary, auditable condition — not a subjective health score.
 */
export function buildReservePressureFactors(input: ReservePressureBuildInput): ReservePressureFactorDto[] {
  const factors: ReservePressureFactorDto[] = [];
  const seen = new Set<string>();
  const { forecast, contractor, goals, enabledAllocationRuleCount, discretionaryOutflowStats } = input;
  const w30 = forecast.windows.find(w => w.windowDays === 30) ?? forecast.windows[forecast.windows.length - 1];

  for (const r of forecast.risks) {
    if (r.code === 'PROJECTED_LOW_BALANCE') {
      pushDeduped(
        factors,
        seen,
        r.severity === 'critical'
          ? {
              code: 'PROJECTED_LOW_BALANCE_CRITICAL',
              summary: r.summary,
              reasoning: [r.detail, 'Source: buildCashFlowForecast → analyzeRisks (30d window).'],
            }
          : {
              code: 'PROJECTED_LOW_BALANCE_WARNING',
              summary: r.summary,
              reasoning: [r.detail, 'Source: buildCashFlowForecast → analyzeRisks.'],
            }
      );
    }
    if (r.code === 'ALLOCATION_PRESSURE') {
      pushDeduped(factors, seen, {
        code: 'ALLOCATION_PRESSURE',
        summary: r.summary,
        reasoning: [
          r.detail,
          'Trailing 28d SmartAllocation aggregate ÷ 4 compared to projected minimum balance (cashflow explain).',
        ],
      });
    }
    if (r.code === 'DEPOSIT_RUNWAY_WARNING') {
      pushDeduped(factors, seen, {
        code: 'DEPOSIT_RUNWAY_WARNING',
        summary: r.summary,
        reasoning: [r.detail],
      });
    }
  }

  const timingRisks = forecast.risks.filter(x =>
    ['BILLS_BEFORE_NEXT_INCOME', 'BILL_CLUSTER', 'INVOICE_RECEIVABLE_GAP'].includes(x.code)
  );
  if (timingRisks.length > 0) {
    pushDeduped(factors, seen, {
      code: 'CASH_TIMING_OR_RECEIVABLE_STRESS',
      summary: 'Cash timing or receivable modeling stress in the 30d forecast',
      reasoning: timingRisks.map(x => `${x.code}: ${x.detail}`),
    });
  }

  if (enabledAllocationRuleCount > 0 && w30 && w30.expectedAllocationImpactTotal > 0) {
    pushDeduped(factors, seen, {
      code: 'AUTOMATION_ALLOCATION_ACTIVE',
      summary: 'Enabled allocation automation rules exist while modeled allocation drag is non-zero',
      reasoning: [
        `${enabledAllocationRuleCount} enabled AutomationRule row(s) with type ALLOCATION.`,
        `30d modeled allocation drag total ≈ $${w30.expectedAllocationImpactTotal.toFixed(2)} (even daily spread in forecast).`,
      ],
    });
  }

  const weakIncome = forecast.recurringIncome.find(s => s.cadence === 'unknown' || s.confidence < 0.5);
  if (weakIncome) {
    pushDeduped(factors, seen, {
      code: 'INCOME_SERIES_LOW_CONFIDENCE',
      summary: 'At least one detected income series has weak cadence or confidence',
      reasoning: [
        `Example: "${weakIncome.label}" cadence=${weakIncome.cadence}, confidence=${weakIncome.confidence.toFixed(2)}.`,
        'Uncertain inflows require conservative reserve pacing.',
      ],
    });
  }

  if (contractor.hasContractorContext) {
    if (contractor.materialExposure.length > 0) {
      pushDeduped(factors, seen, {
        code: 'CONTRACTOR_MATERIAL_EXPOSURE',
        summary: 'Job material spend exceeds collected deposit on at least one active gate',
        reasoning: [
          `${contractor.materialExposure.length} job(s) in contractor material exposure list.`,
          'Uses Job deposit gate + jobExpenses vs depositPaid (recomputeJobRevenue rollups).',
        ],
      });
    }
    if (contractor.negativeMarginJobs.length > 0) {
      pushDeduped(factors, seen, {
        code: 'CONTRACTOR_NEGATIVE_MARGIN',
        summary: 'Active jobs with negative estimated profit',
        reasoning: [`${contractor.negativeMarginJobs.length} job(s) with estimatedProfit < 0 in active statuses.`],
      });
    }
    const conc = contractor.receivableConcentration;
    if (conc.openInvoiceCount >= 2 && conc.herfindahlIndex >= 0.5) {
      pushDeduped(factors, seen, {
        code: 'CONTRACTOR_RECEIVABLE_CONCENTRATION',
        summary: 'Open receivables concentrated by client (HHI)',
        reasoning: [
          `HHI=${conc.herfindahlIndex.toFixed(3)} across ${conc.openInvoiceCount} open invoice(s).`,
          'Same formula as contractor portfolio concentration.',
        ],
      });
    }
  }

  const activeGoals = goals.filter(g => g.status === OperationalGoalStatus.ACTIVE);
  let underfill = 0;
  for (const g of activeGoals) {
    if (!RESERVE_PROGRESS_KINDS.includes(g.goalKind)) continue;
    const target = g.targetAmount;
    if (!(target > 0)) continue;
    const progress = Math.min(g.smartBucket.currentAmount, target) / target;
    if (progress < RESERVE_UNDERFILL_THRESHOLD - 1e-6) underfill += 1;
  }
  if (underfill > 0) {
    pushDeduped(factors, seen, {
      code: 'RESERVE_GOALS_UNDER_HALF',
      summary: 'One or more reserve-type operational goals are under 50% of target',
      reasoning: [
        `Under-filled reserve goals (EMERGENCY_FUND, TAX_RESERVE, BUSINESS_RESERVE, RUNWAY): ${underfill}.`,
        'Progress uses min(bucket.currentAmount, targetAmount) / targetAmount on linked SmartBucket.',
      ],
    });
  }

  /**
   * Discretionary spend pressure — binary and **gated**.
   * Only fires when discretionary outflow share crosses the threshold AND a
   * pre-existing low-balance / allocation / timing pressure already exists.
   * This prevents the factor from acting as a stand-alone alarm.
   */
  const gatingCodes = [
    'ALLOCATION_PRESSURE',
    'PROJECTED_LOW_BALANCE_WARNING',
    'PROJECTED_LOW_BALANCE_CRITICAL',
    'CASH_TIMING_OR_RECEIVABLE_STRESS',
  ];
  const hasGating = factors.some(f => gatingCodes.includes(f.code));
  if (hasGating && isDiscretionaryPressure(discretionaryOutflowStats)) {
    const sharePct = (discretionaryOutflowStats.discretionaryShare * 100).toFixed(1);
    const topNames = discretionaryOutflowStats.topDiscretionaryCategories.map(c => c.name).join(', ') || 'n/a';
    pushDeduped(factors, seen, {
      code: 'DISCRETIONARY_SPEND_PRESSURE',
      summary: 'Discretionary outflow share is elevated while reserve / cash pressure already fires',
      reasoning: [
        `Trailing ${discretionaryOutflowStats.lookbackDays}d discretionary share ≈ ${sharePct}% of OUTFLOW (threshold ${(DISCRETIONARY_PRESSURE_THRESHOLD * 100).toFixed(0)}%).`,
        `Top discretionary categories: ${topNames}.`,
        'Source: FinancialTransaction OUTFLOW + non-transfer rows matched against an explicit discretionary pattern list (lib/reserve-allocation-intelligence/discretionary.ts).',
        'Gated by an existing ALLOCATION_PRESSURE / PROJECTED_LOW_BALANCE / CASH_TIMING_OR_RECEIVABLE_STRESS factor.',
      ],
    });
  }

  return factors;
}

export function reservePressureScore(factors: ReservePressureFactorDto[]): number {
  return factors.length;
}

export function countReserveGoalsUnderHalf(
  goals: (OperationalGoal & { smartBucket: SmartBucket })[]
): number {
  const activeGoals = goals.filter(g => g.status === OperationalGoalStatus.ACTIVE);
  let underfill = 0;
  for (const g of activeGoals) {
    if (!RESERVE_PROGRESS_KINDS.includes(g.goalKind)) continue;
    const target = g.targetAmount;
    if (!(target > 0)) continue;
    const progress = Math.min(g.smartBucket.currentAmount, target) / target;
    if (progress < RESERVE_UNDERFILL_THRESHOLD - 1e-6) underfill += 1;
  }
  return underfill;
}

/**
 * Deterministic top-N under-filled reserve goals (lowest progress first).
 * Tie-break: by goal name then goal id to keep snapshot stable across calls.
 */
export function selectTopUnderfilledReserveGoals(
  goals: (OperationalGoal & { smartBucket: SmartBucket })[],
  limit: number = TOP_UNDERFILL_LIMIT
): ReserveGoalUnderfillDto[] {
  const candidates: ReserveGoalUnderfillDto[] = [];
  for (const g of goals) {
    if (g.status !== OperationalGoalStatus.ACTIVE) continue;
    if (!RESERVE_PROGRESS_KINDS.includes(g.goalKind)) continue;
    const target = g.targetAmount;
    if (!(target > 0)) continue;
    const current = g.smartBucket.currentAmount;
    const progress = Math.min(current, target) / target;
    if (progress >= RESERVE_UNDERFILL_THRESHOLD - 1e-6) continue;
    candidates.push({
      goalId: g.id,
      name: g.name,
      goalKind: g.goalKind,
      targetAmount: target,
      currentAmount: current,
      progress,
    });
  }
  candidates.sort(
    (a, b) =>
      a.progress - b.progress ||
      a.name.localeCompare(b.name) ||
      (a.goalId > b.goalId ? 1 : a.goalId < b.goalId ? -1 : 0)
  );
  return candidates.slice(0, Math.max(0, limit));
}

export function buildReserveAllocationGuidance(
  factors: ReservePressureFactorDto[]
): ReserveAllocationGuidanceRowDto[] {
  const codes = new Set(factors.map(f => f.code));
  const rows: ReserveAllocationGuidanceRowDto[] = [];

  if (codes.has('ALLOCATION_PRESSURE') || codes.has('AUTOMATION_ALLOCATION_ACTIVE')) {
    rows.push({
      code: 'REVIEW_DISCRETIONARY_AUTOMATION',
      title: 'Review discretionary allocation automation',
      detail:
        'Open Money Control → Automation rules. Narrow or pause ALLOCATION rules when modeled drag overlaps thin runway — changes require your explicit save; StackZen does not auto-edit rules.',
      reasoning: [
        'Uses the same trailing SmartAllocation pace embedded in buildCashFlowForecast.',
        'Pair with operational action proposals to pause a specific rule when offered.',
      ],
    });
  }

  if (codes.has('RESERVE_GOALS_UNDER_HALF')) {
    rows.push({
      code: 'PRIORITIZE_RESERVE_GOALS',
      title: 'Prioritize reserve operational goals',
      detail:
        'Emergency, tax, business reserve, or runway goals below half target: increase voluntary contributions or extend target dates in Goals — no automatic bucket transfers.',
      reasoning: ['Progress is read from SmartBucket.currentAmount vs OperationalGoal.targetAmount.'],
    });
  }

  if (codes.has('CONTRACTOR_MATERIAL_EXPOSURE') || codes.has('CONTRACTOR_NEGATIVE_MARGIN')) {
    rows.push({
      code: 'BRIDGE_CONTRACTOR_AND_PERSONAL_RUNWAY',
      title: 'Align contractor job cash with personal reserves',
      detail:
        'Job-side exposure interacts with personal liquidity. Collect deposits/invoices before new material spend; cross-check Cash Flow when contractor factors fire.',
      reasoning: ['Contractor snapshot uses Job + Invoice canonical fields only.'],
    });
  }

  if (codes.has('PROJECTED_LOW_BALANCE_CRITICAL') || codes.has('PROJECTED_LOW_BALANCE_WARNING')) {
    rows.push({
      code: 'CONFIRM_CASHFLOW_ASSUMPTIONS',
      title: 'Confirm cash flow assumptions',
      detail:
        'Low projected balance uses bank balances, bills, invoices, and allocation drag. Update recurring bills, invoice expectations, or categorized transactions in Money Control.',
      reasoning: ['Forecast explain lists sampled row counts and weekly allocation estimate.'],
    });
  }

  if (codes.has('INCOME_SERIES_LOW_CONFIDENCE') || codes.has('CASH_TIMING_OR_RECEIVABLE_STRESS')) {
    rows.push({
      code: 'STABILIZE_RESERVE_PACING',
      title: 'Stabilize reserve pacing against volatile timing',
      detail:
        'Weak income pattern confidence or bill/receivable timing stress: keep a larger explicit buffer in reserve goals until inflows are more predictable.',
      reasoning: ['Income series metrics come from recurrence detection on FinancialTransaction history.'],
    });
  }

  if (codes.has('DISCRETIONARY_SPEND_PRESSURE')) {
    rows.push({
      code: 'TRIM_DISCRETIONARY_OUTFLOWS',
      title: 'Trim discretionary outflows during this pressure window',
      detail:
        'Discretionary categories are absorbing a large share of outflows while reserve or runway pressure is already firing. Review the categorized transactions in Money Control — no transfers are made automatically.',
      reasoning: [
        'Detection uses an explicit, code-visible discretionary pattern list — no hidden tagging.',
        'Factor only fires when a low-balance / allocation pressure factor is already present.',
      ],
    });
  }

  return rows;
}
