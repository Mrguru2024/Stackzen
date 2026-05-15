import type { ForecastSummaryDto, OperationalActionKind } from '@/lib/operational-actions/types';

/**
 * Forecast snapshots captured around the most recent applied event of this kind in window.
 * Reads from FinancialEvent.metadata; older events that pre-date the summary persistence
 * upgrade will leave these as null.
 */
export interface AppliedActionBalanceDeltaDto {
  forecastSummaryBefore: ForecastSummaryDto;
  forecastSummaryAfter: ForecastSummaryDto;
  lowestProjectedBalanceDeltaUsd: number | null;
  projectedEndingBalanceDeltaUsd: number | null;
  capturedAtEventId: string;
  capturedAt: string;
}

export interface AppliedActionAggregateDto {
  kind: OperationalActionKind;
  count: number;
  /** Oldest forecast snapshot timestamp captured before any applied event in window. */
  oldestForecastBeforeAt: string | null;
  /** Newest forecast snapshot timestamp captured after any applied event in window. */
  newestForecastAfterAt: string | null;
  /** Numeric before/after snapshot from the most recent applied event (if persisted). */
  latestBalanceDelta: AppliedActionBalanceDeltaDto | null;
}

export interface GoalContributionAggregateDto {
  count: number;
  totalUsd: number;
  goalsTouched: number;
  milestoneCount: number;
}

export interface OpenAttentionStateDto {
  queueSize: number;
  oldestPendingProposalAgeDays: number | null;
  oldestPendingProposalNotificationId: string | null;
}

export type WorkflowResolutionMomentumFactorCode =
  | 'CORRECTIVE_ACTIONS_APPLIED'
  | 'ATTENTION_AUTO_RESOLVED'
  | 'GOAL_CONTRIBUTIONS_LOGGED'
  | 'GOAL_MILESTONES_REACHED'
  | 'ACTIVATION_PROGRESS_RECORDED';

export interface WorkflowResolutionMomentumFactorDto {
  code: WorkflowResolutionMomentumFactorCode;
  summary: string;
  reasoning: string[];
}

export interface WorkflowResolutionExplainDto {
  assumptions: string[];
  inputsUsed: Record<string, number | string | boolean>;
}

export interface WorkflowResolutionSnapshotDto {
  generatedAt: string;
  windowDays: number;
  /**
   * Number of momentum factors that fired in the window (0–5). NOT a financial health score —
   * just a transparent count of which kinds of follow-through were observed.
   */
  momentumFactorCount: number;
  factors: WorkflowResolutionMomentumFactorDto[];
  appliedActions: AppliedActionAggregateDto[];
  dismissedActionCount: number;
  recommendationsIssuedInWindow: number;
  attentionAutoResolvedInWindow: number;
  goalContributions: GoalContributionAggregateDto;
  activationMilestonesInWindow: number;
  openAttention: OpenAttentionStateDto;
  explain: WorkflowResolutionExplainDto;
}
