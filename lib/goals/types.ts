import type { CashFlowForecastResponseDto } from '@/lib/cashflow/types';

export type GoalRiskFindingCode =
  | 'MISSED_TARGET_PACE'
  | 'ALLOCATION_PRESSURE_CONFLICT'
  | 'FORECAST_LOW_BALANCE_WITH_GOAL_DEMAND';

export interface GoalAnalysisFinding {
  code: GoalRiskFindingCode;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  detail: string;
  /** Human-readable deterministic reasoning (audit trail). */
  explain: string[];
}

export interface GoalAnalysisDto {
  goalId: string;
  currentProgress: number;
  targetAmount: number;
  remaining: number;
  /** ISO date or null if open-ended analysis horizon */
  targetDate: string | null;
  /** Calendar days used in pace math */
  daysRemaining: number;
  requiredAverageDaily: number;
  trailing30DayAverageDailyContribution: number;
  forecastDailyAllocationDrag30d: number | null;
  projectedCompletionDate: string | null;
  findings: GoalAnalysisFinding[];
  /** Top-level explain lines for UI */
  summaryExplain: string[];
}

export type GoalAnalyzeContext = {
  forecast: CashFlowForecastResponseDto;
};
