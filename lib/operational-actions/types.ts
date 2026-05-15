import type { NotificationSeverity } from '@prisma/client';

export type OperationalActionKind =
  | 'PAUSE_AUTOMATION_RULE'
  | 'RECORD_GOAL_CONTRIBUTION'
  | 'EXTEND_GOAL_TARGET_DATE'
  | 'SHIFT_RECURRING_BILL_DATE'
  | 'PREPARE_RESERVE_FOR_OBLIGATION';

export type OperationalActionProposalStatus = 'pending' | 'applied' | 'dismissed' | 'stale';

export interface OperationalActionExplainDto {
  why: string;
  dataInfluences: string[];
  calculations: string[];
  expectedImpact: string;
}

export interface OperationalActionProposalPayloadPauseRule {
  ruleId: string;
  ruleName: string;
}

export interface OperationalActionProposalPayloadGoalContribution {
  goalId: string;
  goalName: string;
  suggestedAmount: number;
  bucketId: string;
  bucketName: string;
  currentBucketAmount: number;
}

export interface OperationalActionProposalPayloadExtendGoalDate {
  goalId: string;
  goalName: string;
  previousTargetDate: string;
  proposedTargetDate: string;
}

/**
 * Drag-and-drop on the timing calendar produces this payload. `previousDate` is
 * the current `RecurringBill.nextDueDate` ISO at proposal-build time; `proposedDate`
 * is the user-chosen drop target. Only `RecurringBill.nextDueDate` is mutated on apply.
 */
export interface OperationalActionProposalPayloadShiftBillDate {
  billId: string;
  billName: string;
  previousDate: string;
  proposedDate: string;
  amount: number;
}

/**
 * Records the user's intent to fund a reserve goal ahead of an obligation cluster.
 * Apply writes ONLY the FinancialEvent (kind=PREPARE_RESERVE_FOR_OBLIGATION, prepIntent=true).
 * The actual contribution still flows through RECORD_GOAL_CONTRIBUTION.
 */
export interface OperationalActionProposalPayloadPrepareReserve {
  goalId: string;
  goalName: string;
  clusterId: string;
  clusterStartDate: string;
  clusterEndDate: string;
  targetAmount: number;
}

export type OperationalActionProposalPayload =
  | OperationalActionProposalPayloadPauseRule
  | OperationalActionProposalPayloadGoalContribution
  | OperationalActionProposalPayloadExtendGoalDate
  | OperationalActionProposalPayloadShiftBillDate
  | OperationalActionProposalPayloadPrepareReserve;

export interface OperationalActionProposalCore {
  version: 1;
  status: OperationalActionProposalStatus;
  kind: OperationalActionKind;
  fingerprint: string;
  payload: OperationalActionProposalPayload;
  explain: OperationalActionExplainDto;
  lastForecastGeneratedAt: string;
}

export interface OperationalActionProposalRow {
  attentionKind: string;
  title: string;
  body: string;
  severity: NotificationSeverity;
  proposal: OperationalActionProposalCore;
}

export interface ForecastSummaryDto {
  generatedAt: string;
  riskCodes: string[];
  lowestProjectedBalance30d: number | null;
  lowestProjectedBalanceDate30d: string | null;
  projectedEndingBalance30d: number | null;
}

export interface OperationalActionPreviewDto {
  notificationId: string;
  kind: OperationalActionKind;
  fingerprint: string;
  forecastSummaryBefore: ForecastSummaryDto;
  /** Deterministic narrative; full counterfactual forecast requires apply + refresh. */
  notes: string[];
  goalContributionPreview?: {
    suggestedAmount: number;
    projectedBucketBalanceAfter: number;
  };
  extendGoalPreview?: {
    previousTargetDate: string;
    proposedTargetDate: string;
  };
  shiftBillPreview?: {
    billId: string;
    billName: string;
    previousDate: string;
    proposedDate: string;
    amount: number;
  };
  prepareReservePreview?: {
    goalId: string;
    goalName: string;
    clusterId: string;
    targetAmount: number;
  };
}

export interface OperationalActionApplyResultDto {
  ok: true;
  kind: OperationalActionKind;
  forecastSummaryBefore: ForecastSummaryDto;
  forecastSummaryAfter: ForecastSummaryDto;
}
