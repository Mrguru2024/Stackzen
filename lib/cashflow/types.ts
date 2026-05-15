export type CadenceKind = 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'unknown';

export type RiskCode =
  | 'PROJECTED_LOW_BALANCE'
  | 'BILLS_BEFORE_NEXT_INCOME'
  | 'BILL_CLUSTER'
  | 'ALLOCATION_PRESSURE'
  | 'INVOICE_RECEIVABLE_GAP'
  | 'DEPOSIT_RUNWAY_WARNING';

export interface DetectedSeriesDto {
  key: string;
  direction: 'INFLOW' | 'OUTFLOW';
  label: string;
  medianAmount: number;
  cadence: CadenceKind;
  medianIntervalDays: number;
  occurrences: number;
  confidence: number;
  sampleTransactionIds: string[];
  nextExpectedDate: string | null;
}

export interface CashflowEventDto {
  date: string;
  /** Positive magnitude in USD */
  amount: number;
  direction: 'INFLOW' | 'OUTFLOW';
  kind:
    | 'recurring_bill'
    | 'detected_obligation'
    | 'detected_income'
    | 'invoice_expected_payment'
    | 'allocation_drag';
  label: string;
  referenceIds: string[];
}

export interface DailyBalancePointDto {
  date: string;
  balance: number;
}

export interface ForecastWindowResultDto {
  windowDays: number;
  startingBalance: number;
  projectedEndingBalance: number;
  lowestProjectedBalance: number;
  lowestProjectedBalanceDate: string | null;
  expectedIncomeTotal: number;
  expectedBillsTotal: number;
  expectedAllocationImpactTotal: number;
  riskLevel: 'low' | 'medium' | 'high';
  events: CashflowEventDto[];
  daily?: DailyBalancePointDto[];
}

export interface RiskFindingDto {
  code: RiskCode;
  severity: 'info' | 'warning' | 'critical';
  summary: string;
  detail: string;
  /** 0–1 explainability weight */
  confidence: number;
}

export interface CashFlowForecastResponseDto {
  generatedAt: string;
  windows: ForecastWindowResultDto[];
  recurringObligations: DetectedSeriesDto[];
  recurringIncome: DetectedSeriesDto[];
  risks: RiskFindingDto[];
  explain: {
    assumptions: string[];
    inputsUsed: Record<string, number | string | string[]>;
    confidence: 'low' | 'medium' | 'high';
  };
}
