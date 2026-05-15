import type {
  ForecastInstabilityWindowDto,
  ObligationClusterDto,
  PayoutBillConflictDto,
  ReservePrepGoalRefDto,
  TimingGuidanceRowDto,
  TimingPressureFactorDto,
} from '@/lib/timing-coordination/types';

const ELEVATED_FACTOR_THRESHOLD = 3;

export interface BuildTimingPressureFactorsInput {
  clusters: ObligationClusterDto[];
  conflicts: PayoutBillConflictDto[];
  instabilityWindow: ForecastInstabilityWindowDto | null;
  reservePrepGoals: ReservePrepGoalRefDto[];
  /** Late-payer client count from contractor snapshot — drives CONTRACTOR_PAYOUT_OVERLAP. */
  contractorLatePayerClientCount: number;
}

function topDenseCluster(clusters: ObligationClusterDto[]): ObligationClusterDto | null {
  return clusters.find(c => c.dense) ?? null;
}

function pushDeduped(out: TimingPressureFactorDto[], factor: TimingPressureFactorDto): void {
  if (out.some(f => f.code === factor.code)) return;
  out.push(factor);
}

export function buildTimingPressureFactors(
  input: BuildTimingPressureFactorsInput
): TimingPressureFactorDto[] {
  const factors: TimingPressureFactorDto[] = [];

  if (input.clusters.length >= 1) {
    pushDeduped(factors, {
      code: 'OBLIGATION_CLUSTER_PRESENT',
      summary: `Detected ${input.clusters.length} obligation cluster(s) in the 30-day forecast window.`,
      reasoning: [
        'At least one cluster of ≥3 outflows summing ≥$200 within a 5-day band exists.',
        'Cluster detection runs on forecast events only (no transaction re-detection).',
      ],
    });
  }

  const dense = topDenseCluster(input.clusters);
  if (dense) {
    pushDeduped(factors, {
      code: 'OBLIGATION_CLUSTER_DENSE',
      summary: `Top cluster (${dense.startDate}–${dense.endDate}) totals $${dense.totalAmountUsd.toFixed(2)}, > 30% of starting balance.`,
      reasoning: [
        `Cluster id ${dense.id} marked dense by detectObligationClusters.`,
        'Dense clusters elevate timing pressure independently of factor count.',
      ],
    });
  }

  if (input.conflicts.length >= 1) {
    const first = input.conflicts[0];
    pushDeduped(factors, {
      code: 'PAYOUT_BILL_CONFLICT',
      summary: `Cumulative outflow exceeds cumulative inflow on ${first.date} by $${first.deficitUsd.toFixed(2)} within the 14-day window.`,
      reasoning: [
        `${input.conflicts.length} conflict day(s) detected.`,
        'Conflict is ledger-side; starting balance can absorb it — combined with PROJECTED_LOW_BALANCE it becomes operationally meaningful.',
      ],
    });
  }

  if (input.instabilityWindow) {
    pushDeduped(factors, {
      code: 'FORECAST_INSTABILITY_WINDOW',
      summary: `Projected balance stays below $${input.instabilityWindow.thresholdUsd.toFixed(2)} for ${input.instabilityWindow.daysCount} consecutive days.`,
      reasoning: [
        `Window ${input.instabilityWindow.startDate} → ${input.instabilityWindow.endDate}.`,
        'Threshold is 25% of starting balance; minimum 3 consecutive days.',
      ],
    });
  }

  if (input.reservePrepGoals.length >= 1) {
    pushDeduped(factors, {
      code: 'RESERVE_PREP_BEHIND_CLUSTER',
      summary: `${input.reservePrepGoals.length} reserve goal(s) under 50% progress with a cluster in ≤7 days.`,
      reasoning: [
        `Affected goal ids: ${input.reservePrepGoals.map(g => g.goalId).join(', ')}.`,
        'Reserve-prep factor only fires when a cluster sits within 7 days AND a reserve goal is below 50%.',
      ],
    });
  }

  if (input.contractorLatePayerClientCount > 0 && input.clusters.length >= 1) {
    pushDeduped(factors, {
      code: 'CONTRACTOR_PAYOUT_OVERLAP',
      summary: `${input.contractorLatePayerClientCount} late-paying client group(s) overlap with an upcoming bill cluster.`,
      reasoning: [
        'Late-payer client count comes from buildContractorFinancialOpsSnapshot (summarizeLatePayersByClient).',
        'Factor only fires when both a cluster and a late-payer group exist; never alone.',
      ],
    });
  }

  return factors;
}

export function timingPressureScore(factors: TimingPressureFactorDto[]): number {
  return factors.length;
}

export function isElevatedTimingPressure(params: {
  factorsLen: number;
  hasDenseCluster: boolean;
  hasReservePrepBehind: boolean;
}): boolean {
  return (
    params.factorsLen >= ELEVATED_FACTOR_THRESHOLD ||
    params.hasDenseCluster ||
    params.hasReservePrepBehind
  );
}

export function buildTimingGuidance(input: {
  factors: TimingPressureFactorDto[];
  clusters: ObligationClusterDto[];
  conflicts: PayoutBillConflictDto[];
  reservePrepGoals: ReservePrepGoalRefDto[];
}): TimingGuidanceRowDto[] {
  const codes = new Set(input.factors.map(f => f.code));
  const out: TimingGuidanceRowDto[] = [];

  if (codes.has('PAYOUT_BILL_CONFLICT')) {
    out.push({
      code: 'DELAY_DISCRETIONARY_ALLOCATION',
      title: 'Delay discretionary allocation',
      detail:
        'Pause low-priority allocation rules until cumulative inflow catches up to outflow. Money Control rules tab lets you preview the change.',
      reasoning: [
        'Cumulative outflow exceeds cumulative inflow inside the 14-day window.',
        'Pausing a rule is reversible and routes through the operational-actions preview/apply pipeline.',
      ],
    });
  }

  if (codes.has('RESERVE_PREP_BEHIND_CLUSTER')) {
    out.push({
      code: 'PREPARE_RESERVE_BUFFER',
      title: 'Prepare a reserve buffer for the upcoming cluster',
      detail: `Fund ${input.reservePrepGoals.map(g => g.name).join(', ') || 'a reserve goal'} before the cluster window opens. Approval still flows through the operational-actions apply path.`,
      reasoning: [
        'Reserve goals are below 50% with a cluster within 7 days.',
        'Voluntary contribution stays on the user-approved RECORD_GOAL_CONTRIBUTION pipeline.',
      ],
    });
  }

  if (codes.has('OBLIGATION_CLUSTER_DENSE')) {
    out.push({
      code: 'SLOW_LOW_PRIORITY_GOAL',
      title: 'Slow a low-priority goal',
      detail:
        'Extend a low-priority operational goal target date to lower implied daily pace; no money moves — only planning metadata.',
      reasoning: [
        'Top cluster is dense relative to starting balance.',
        'Re-uses existing EXTEND_GOAL_TARGET_DATE operational action.',
      ],
    });
  }

  if (input.clusters.some(c => c.events.some(e => e.kind === 'recurring_bill'))) {
    out.push({
      code: 'SHIFT_TO_AVOID_CLUSTER',
      title: 'Shift a recurring bill out of the cluster',
      detail:
        'Drag a recurring-bill chip on the calendar to a less crowded day. Drop opens a SHIFT_RECURRING_BILL_DATE proposal you can preview and approve.',
      reasoning: [
        'Cluster includes ≥1 recurring-bill event whose nextDueDate is writable.',
        'No autonomous write — drop creates an AutomationNotification; apply step is user-approved.',
      ],
    });
  }

  if (codes.has('CONTRACTOR_PAYOUT_OVERLAP')) {
    out.push({
      code: 'CONTRACTOR_TIGHTEN_DEPOSIT_TIMING',
      title: 'Tighten contractor deposit & payout timing',
      detail:
        'Late-paying client overlap with a bill cluster — confirm deposits up-front on open jobs and follow up on overdue invoices.',
      reasoning: [
        'Contractor snapshot late-payer concentration overlapped with an obligation cluster.',
        'Use existing Contractor operations panel actions, not autonomous re-billing.',
      ],
    });
  }

  return out;
}
