import type { OperationalGoalKind } from '@prisma/client';
import type { DiscretionaryOutflowStatsDto } from '@/lib/reserve-allocation-intelligence/discretionary';

export interface ReservePressureFactorDto {
  code: string;
  summary: string;
  reasoning: string[];
}

export interface ReserveAllocationGuidanceRowDto {
  code: string;
  title: string;
  detail: string;
  reasoning: string[];
}

export interface ReserveAllocationExplainDto {
  assumptions: string[];
  inputsUsed: Record<string, number | string | boolean>;
}

/** Read-only context for Money Control — not a counterfactual re-forecast. */
export interface EnabledAllocationRuleSampleDto {
  id: string;
  name: string;
  priority: number;
}

/** Read-only `SavingsRule` context (separate automation surface from AutomationRule). */
export interface SavingsRuleSampleDto {
  id: string;
  name: string;
  type: string;
}

export interface SavingsRulesContextDto {
  enabledCount: number;
  totalCount: number;
  sample: SavingsRuleSampleDto[];
}

/** Top under-filled reserve operational goals (lowest progress first). */
export interface ReserveGoalUnderfillDto {
  goalId: string;
  name: string;
  goalKind: OperationalGoalKind;
  targetAmount: number;
  currentAmount: number;
  /** min(currentAmount, targetAmount) / targetAmount — 0..1 */
  progress: number;
}

export interface ReserveAllocationSnapshotDto {
  generatedAt: string;
  /** Factor count; not a subjective health score. */
  pressureScore: number;
  factors: ReservePressureFactorDto[];
  guidance: ReserveAllocationGuidanceRowDto[];
  weeklyAllocationEstimateUsd: number;
  enabledAllocationRuleCount: number;
  /** Top rules by priority for review; does not simulate balance impact. */
  enabledAllocationRulesSample: EnabledAllocationRuleSampleDto[];
  reserveGoalUnderfillCount: number;
  /** Reserve goals under 50% target progress, lowest first (up to 3). */
  topUnderfilledReserveGoals: ReserveGoalUnderfillDto[];
  /** Trailing 30-day OUTFLOW discretionary share. */
  discretionaryOutflowStats: DiscretionaryOutflowStatsDto;
  /** SavingsRule visibility (separate from AutomationRule). */
  savingsRulesContext: SavingsRulesContextDto;
  explain: ReserveAllocationExplainDto;
}
