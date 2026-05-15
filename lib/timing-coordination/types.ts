import type { OperationalGoalKind } from '@prisma/client';
import type { CashflowEventDto } from '@/lib/cashflow/types';

/**
 * Deterministic timing-pressure factor. The snapshot's pressureScore is `factors.length`
 * — never a weighted score, never a percentage, never a subjective health index.
 */
export interface TimingPressureFactorDto {
  code: TimingPressureFactorCode;
  summary: string;
  reasoning: string[];
}

export type TimingPressureFactorCode =
  | 'OBLIGATION_CLUSTER_PRESENT'
  | 'OBLIGATION_CLUSTER_DENSE'
  | 'PAYOUT_BILL_CONFLICT'
  | 'FORECAST_INSTABILITY_WINDOW'
  | 'RESERVE_PREP_BEHIND_CLUSTER'
  | 'CONTRACTOR_PAYOUT_OVERLAP';

export interface ObligationClusterEventDto {
  date: string;
  amountUsd: number;
  label: string;
  kind: CashflowEventDto['kind'];
  referenceIds: string[];
}

export interface ObligationClusterDto {
  id: string;
  startDate: string;
  endDate: string;
  bandDays: number;
  totalAmountUsd: number;
  /** Whether totalAmountUsd > startingBalance * 0.30 — drives OBLIGATION_CLUSTER_DENSE. */
  dense: boolean;
  events: ObligationClusterEventDto[];
  reasoning: string[];
}

export interface PayoutBillConflictDto {
  date: string;
  deficitUsd: number;
  precedingInflowUsd: number;
  outflowOnDayUsd: number;
  reasoning: string[];
}

export interface ForecastInstabilityWindowDto {
  startDate: string;
  endDate: string;
  daysCount: number;
  thresholdUsd: number;
  reasoning: string[];
}

export interface ReservePrepGoalRefDto {
  goalId: string;
  name: string;
  goalKind: OperationalGoalKind;
  progress: number;
}

export interface TimingGuidanceRowDto {
  code: TimingGuidanceCode;
  title: string;
  detail: string;
  reasoning: string[];
}

export type TimingGuidanceCode =
  | 'DELAY_DISCRETIONARY_ALLOCATION'
  | 'PREPARE_RESERVE_BUFFER'
  | 'SLOW_LOW_PRIORITY_GOAL'
  | 'SHIFT_TO_AVOID_CLUSTER'
  | 'CONTRACTOR_TIGHTEN_DEPOSIT_TIMING';

export type TimingCalendarEntryDirection = 'INFLOW' | 'OUTFLOW' | 'NEUTRAL';

export type TimingCalendarEntryKind =
  | CashflowEventDto['kind']
  | 'goal_target'
  | 'invoice_due';

export interface TimingCalendarEntryDto {
  /** Stable id derived from `${kind}:${primaryReferenceId ?? label}:${ymd}` */
  id: string;
  date: string;
  kind: TimingCalendarEntryKind;
  direction: TimingCalendarEntryDirection;
  label: string;
  amountUsd: number | null;
  referenceIds: string[];
  clusterId: string | null;
  /** True only when the entry maps to a writable `RecurringBill.nextDueDate` row. */
  shiftable: boolean;
  reasoning: string[];
}

export interface TimingExplainDto {
  assumptions: string[];
  inputsUsed: Record<string, number | string | boolean>;
}

export interface TimingCoordinationSnapshotDto {
  generatedAt: string;
  pressureScore: number;
  factors: TimingPressureFactorDto[];
  clusters: ObligationClusterDto[];
  conflicts: PayoutBillConflictDto[];
  instabilityWindow: ForecastInstabilityWindowDto | null;
  reservePrepGoals: ReservePrepGoalRefDto[];
  guidance: TimingGuidanceRowDto[];
  calendarEntries: TimingCalendarEntryDto[];
  explain: TimingExplainDto;
}
