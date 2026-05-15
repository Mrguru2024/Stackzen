import type { JobDepositStatus, JobStatus } from '@prisma/client';

export interface JobCashSnapshotDto {
  jobId: string;
  title: string;
  status: JobStatus;
  clientId: string;
  depositStatus: JobDepositStatus;
  depositPaid: number;
  jobRevenue: number;
  jobExpenses: number;
  estimatedProfit: number;
  estimatedAmount: number | null;
}

export interface MaterialExposureJobDto {
  jobId: string;
  title: string;
  clientId: string;
  depositPaid: number;
  jobExpenses: number;
  exposureUsd: number;
  reasoning: string[];
}

export interface NegativeMarginJobDto {
  jobId: string;
  title: string;
  clientId: string;
  estimatedProfit: number;
  jobRevenue: number;
  jobExpenses: number;
  reasoning: string[];
}

export interface OpenReceivableDto {
  invoiceId: string;
  number: string;
  clientId: string;
  amount: number;
  dueDate: string;
  daysPastDue: number | null;
  jobId: string | null;
}

export interface ReceivableConcentrationDto {
  openInvoiceCount: number;
  totalOpenUsd: number;
  herfindahlIndex: number;
  topClients: { clientId: string; totalUsd: number; share: number; invoiceIds: string[] }[];
  reasoning: string[];
}

/** Overdue open AR aggregated per client (amount-weighted lateness). */
export interface LatePayerClientDto {
  clientId: string;
  openOverdueCount: number;
  openOverdueUsd: number;
  weightedAvgDaysPastDue: number;
  invoiceIds: string[];
}

/** Near-term due-date spread for open invoices (operational collection timing, not DSO history). */
export interface CollectionTimingDto {
  windowDays: number;
  upcomingWithinWindowCount: number;
  meanDaysUntilDue: number | null;
  stdevDaysUntilDue: number | null;
  reasoning: string[];
}

export interface ContractorReserveNudgeDto {
  code:
    | 'CASHFLOW_PRESSURE_WITH_JOB_RISK'
    | 'RECEIVABLE_CONCENTRATION_BUFFER'
    | 'TAX_RESERVE_SUGGESTED';
  summary: string;
  detail: string;
  reasoning: string[];
}

export interface ContractorFinancialOpsExplainDto {
  assumptions: string[];
  inputsUsed: Record<string, number | string | boolean>;
}

export interface ContractorFinancialOpsSnapshotDto {
  generatedAt: string;
  hasContractorContext: boolean;
  jobsSample: JobCashSnapshotDto[];
  materialExposure: MaterialExposureJobDto[];
  negativeMarginJobs: NegativeMarginJobDto[];
  openReceivables: OpenReceivableDto[];
  receivableConcentration: ReceivableConcentrationDto;
  latePayerClients: LatePayerClientDto[];
  collectionTiming: CollectionTimingDto;
  reserveNudges: ContractorReserveNudgeDto[];
  forecastRiskCodes: string[];
  explain: ContractorFinancialOpsExplainDto;
}
