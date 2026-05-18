export type MetRepairJobStatus =
  | 'NEW'
  | 'QUOTED'
  | 'APPROVED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'INVOICED'
  | 'PAID'
  | 'CANCELLED'
  | string;

export type MetRepairInvoiceStatus =
  | 'DRAFT'
  | 'SENT'
  | 'PARTIAL'
  | 'PAID'
  | 'OVERDUE'
  | 'VOID'
  | string;

export interface MetRepairJob {
  id: string;
  workOrderLabel: string;
  clientName: string;
  status: MetRepairJobStatus;
  revenue: number;
  expenses: number;
  leadSource: string | null;
  leadCost: number;
  completedAt: string | null;
  invoicedAt: string | null;
  depositReceived: number;
  materialCost: number;
  contractorId: string | null;
  contractorName: string | null;
}

export interface MetRepairInvoice {
  id: string;
  invoiceLabel: string;
  clientName: string;
  jobId: string | null;
  total: number;
  paid: number;
  balance: number;
  dueDate: string | null;
  status: MetRepairInvoiceStatus;
}

export interface MetRepairPayment {
  id: string;
  amount: number;
  jobId: string | null;
  invoiceId: string | null;
  paidAt: string;
  method: string | null;
}

export interface MetRepairExpense {
  id: string;
  amount: number;
  jobId: string | null;
  category: string | null;
  description: string | null;
  incurredAt: string | null;
}

export interface MetRepairContractor {
  id: string;
  name: string;
  jobsCompleted: number;
  totalPayout: number;
  reliabilityScore: number | null;
}

export interface MetRepairFinancialSummary {
  revenue: number;
  totalExpenses: number;
  grossProfit: number;
  netProfit: number;
  profitMargin: number;
  unpaidInvoiceTotal: number;
  completedNotInvoicedTotal: number;
  contractorPayoutTotal: number;
  jobsLosingMoneyCount: number;
  averageMargin: number;
}

export interface LeadSourceRoiRow {
  leadSource: string;
  revenue: number;
  leadCost: number;
  closedJobs: number;
  netProfit: number;
  roi: number;
  costPerClosedJob: number;
}

export interface JobProfitabilityRow {
  jobId: string;
  workOrderLabel: string;
  clientName: string;
  status: MetRepairJobStatus;
  revenue: number;
  expenses: number;
  netProfit: number;
  margin: number;
  risk: 'low' | 'medium' | 'high';
}

export interface ContractorPayoutRow {
  contractorId: string;
  contractorName: string;
  jobsCompleted: number;
  totalPayout: number;
  averagePayout: number;
  averageProfitPerJob: number;
  reliabilityScore: number | null;
}

export type MetRepairAlertSeverity = 'info' | 'warning' | 'critical';

export interface MetRepairFinancialAlert {
  id: string;
  severity: MetRepairAlertSeverity;
  title: string;
  reason: string;
  recommendedAction: string;
  entityType?: 'job' | 'invoice' | 'lead_source' | 'contractor';
  entityId?: string;
}

export interface MetRepairCommandCenterSnapshot {
  fetchedAt: string;
  summary: MetRepairFinancialSummary;
  leadSourceRoi: LeadSourceRoiRow[];
  jobProfitability: JobProfitabilityRow[];
  contractorPayouts: ContractorPayoutRow[];
  unpaidInvoices: MetRepairInvoice[];
  alerts: MetRepairFinancialAlert[];
  jobs: MetRepairJob[];
}

export interface MetRepairsApiErrorInfo {
  message: string;
  status?: number;
  code?: string;
}
