import type { CadenceKind, DetectedSeriesDto } from '@/lib/cashflow/types';

export interface IncomeSourceShareDto {
  seriesKey: string;
  label: string;
  totalUsd: number;
  shareOfTotal: number;
  transactionIdsSample: string[];
}

export interface IncomeConcentrationDto {
  windowDays: number;
  totalInflowUsd: number;
  /** Herfindahl-style concentration: sum of squared income shares by recurring-style grouping key (0–1). */
  herfindahlIndex: number;
  topSources: IncomeSourceShareDto[];
  reasoning: string[];
}

export interface DelayedIncomeSignalDto {
  seriesKey: string;
  label: string;
  cadence: CadenceKind;
  medianAmountUsd: number;
  nextExpectedDate: string;
  daysPastExpected: number;
  sampleTransactionIds: string[];
  reasoning: string[];
}

export interface IrregularPayoutSeriesDto {
  series: DetectedSeriesDto;
  reasoning: string[];
}

export interface DecliningPayoutSignalDto {
  seriesKey: string;
  label: string;
  recentMedianUsd: number;
  priorMedianUsd: number;
  sampleTransactionIds: string[];
  reasoning: string[];
}

export interface ReserveGuidanceNudgeDto {
  code:
    | 'FORECAST_PRESSURE'
    | 'CONCENTRATION_BUFFER'
    | 'DELAYED_DEPOSIT_BUFFER'
    | 'IRREGULAR_PAYOUT_BUFFER';
  summary: string;
  detail: string;
  evidenceTransactionIds: string[];
  reasoning: string[];
}

export interface IncomeIntelligenceExplainDto {
  assumptions: string[];
  inputsUsed: Record<string, number | string | boolean | string[]>;
  /** Human-readable deterministic notes — not probabilistic “scores”. */
  confidenceNotes: string[];
}

export interface IncomeIntelligenceSnapshotDto {
  generatedAt: string;
  lookbackDays: number;
  recurringIncome: DetectedSeriesDto[];
  concentration: IncomeConcentrationDto;
  delayedIncome: DelayedIncomeSignalDto[];
  irregularPayouts: IrregularPayoutSeriesDto[];
  decliningPayouts: DecliningPayoutSignalDto[];
  reserveNudges: ReserveGuidanceNudgeDto[];
  forecastRiskCodes: string[];
  explain: IncomeIntelligenceExplainDto;
}
