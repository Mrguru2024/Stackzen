import { buildMetRepairFinancialAlerts } from '@/lib/integrations/met-repairs/alerts';
import type {
  ContractorPayoutRow,
  JobProfitabilityRow,
  LeadSourceRoiRow,
  MetRepairCommandCenterSnapshot,
  MetRepairContractor,
  MetRepairExpense,
  MetRepairFinancialSummary,
  MetRepairInvoice,
  MetRepairJob,
  MetRepairPayment,
} from '@/lib/integrations/met-repairs/types';

const COMPLETED_STATUSES = new Set(['COMPLETED', 'COMPLETE', 'DONE', 'CLOSED']);
const INVOICED_STATUSES = new Set(['INVOICED', 'PAID', 'PARTIAL', 'SENT']);

function isCompletedStatus(status: string): boolean {
  return COMPLETED_STATUSES.has(status.toUpperCase());
}

function isInvoicedJob(job: MetRepairJob, invoices: MetRepairInvoice[]): boolean {
  if (job.invoicedAt) return true;
  if (INVOICED_STATUSES.has(String(job.status).toUpperCase())) return true;
  return invoices.some(inv => inv.jobId === job.id && inv.balance <= 0.01);
}

function marginPercent(revenue: number, netProfit: number): number {
  if (revenue <= 0) return 0;
  return (netProfit / revenue) * 100;
}

function profitRisk(margin: number, netProfit: number): JobProfitabilityRow['risk'] {
  if (netProfit < 0) return 'high';
  if (margin < 30) return 'medium';
  return 'low';
}

export function computeLeadSourceRoi(jobs: MetRepairJob[]): LeadSourceRoiRow[] {
  const bySource = new Map<string, { revenue: number; leadCost: number; closedJobs: number }>();

  for (const job of jobs) {
    const source = (job.leadSource?.trim() || 'Unknown').toUpperCase();
    const bucket = bySource.get(source) ?? { revenue: 0, leadCost: 0, closedJobs: 0 };
    bucket.revenue += job.revenue;
    bucket.leadCost += job.leadCost;
    if (isCompletedStatus(job.status)) bucket.closedJobs += 1;
    bySource.set(source, bucket);
  }

  return Array.from(bySource.entries())
    .map(([leadSource, stats]) => {
      const netProfit = stats.revenue - stats.leadCost;
      const roi = stats.leadCost > 0 ? (netProfit / stats.leadCost) * 100 : netProfit > 0 ? 100 : 0;
      const costPerClosedJob =
        stats.closedJobs > 0 ? stats.leadCost / stats.closedJobs : stats.leadCost;
      return {
        leadSource,
        revenue: stats.revenue,
        leadCost: stats.leadCost,
        closedJobs: stats.closedJobs,
        netProfit,
        roi,
        costPerClosedJob,
      };
    })
    .sort((a, b) => b.netProfit - a.netProfit);
}

export function computeJobProfitability(jobs: MetRepairJob[]): JobProfitabilityRow[] {
  return jobs
    .map(job => {
      const netProfit = job.revenue - job.expenses;
      const margin = marginPercent(job.revenue, netProfit);
      return {
        jobId: job.id,
        workOrderLabel: job.workOrderLabel,
        clientName: job.clientName,
        status: job.status,
        revenue: job.revenue,
        expenses: job.expenses,
        netProfit,
        margin,
        risk: profitRisk(margin, netProfit),
      };
    })
    .sort((a, b) => a.netProfit - b.netProfit);
}

export function computeContractorPayoutRows(
  jobs: MetRepairJob[],
  contractors: MetRepairContractor[]
): ContractorPayoutRow[] {
  const payoutByContractor = new Map<
    string,
    { name: string; payout: number; jobs: number; profitSum: number }
  >();

  for (const contractor of contractors) {
    payoutByContractor.set(contractor.id, {
      name: contractor.name,
      payout: contractor.totalPayout,
      jobs: contractor.jobsCompleted,
      profitSum: 0,
    });
  }

  for (const job of jobs) {
    if (!job.contractorId) continue;
    const net = job.revenue - job.expenses;
    const row = payoutByContractor.get(job.contractorId) ?? {
      name: job.contractorName ?? job.contractorId,
      payout: 0,
      jobs: 0,
      profitSum: 0,
    };
    row.jobs += isCompletedStatus(job.status) ? 1 : 0;
    row.profitSum += net;
    payoutByContractor.set(job.contractorId, row);
  }

  return Array.from(payoutByContractor.entries())
    .map(([contractorId, stats]) => ({
      contractorId,
      contractorName: stats.name,
      jobsCompleted: stats.jobs,
      totalPayout: stats.payout,
      averagePayout: stats.jobs > 0 ? stats.payout / stats.jobs : stats.payout,
      averageProfitPerJob: stats.jobs > 0 ? stats.profitSum / stats.jobs : 0,
      reliabilityScore:
        contractors.find(c => c.id === contractorId)?.reliabilityScore ?? null,
    }))
    .sort((a, b) => b.totalPayout - a.totalPayout);
}

export function computeFinancialSummary(input: {
  jobs: MetRepairJob[];
  invoices: MetRepairInvoice[];
  expenses: MetRepairExpense[];
  contractors: MetRepairContractor[];
  payments: MetRepairPayment[];
}): MetRepairFinancialSummary {
  const { jobs, invoices, expenses, contractors } = input;

  const revenueFromJobs = jobs.reduce((sum, j) => sum + j.revenue, 0);
  const jobExpenses = jobs.reduce((sum, j) => sum + j.expenses, 0);
  const standaloneExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalExpenses = jobExpenses + standaloneExpenses;
  const grossProfit = revenueFromJobs - totalExpenses;
  const leadCosts = jobs.reduce((sum, j) => sum + j.leadCost, 0);
  const netProfit = grossProfit - leadCosts;
  const profitMargin = marginPercent(revenueFromJobs, netProfit);

  const unpaidInvoiceTotal = invoices
    .filter(inv => inv.balance > 0.01 && !['PAID', 'VOID'].includes(inv.status.toUpperCase()))
    .reduce((sum, inv) => sum + inv.balance, 0);

  const completedNotInvoicedTotal = jobs
    .filter(j => isCompletedStatus(j.status) && !isInvoicedJob(j, invoices))
    .reduce((sum, j) => sum + j.revenue, 0);

  const contractorPayoutTotal =
    contractors.reduce((sum, c) => sum + c.totalPayout, 0) ||
    computeContractorPayoutRows(jobs, contractors).reduce((sum, c) => sum + c.totalPayout, 0);

  const jobsLosingMoneyCount = jobs.filter(j => j.revenue - j.expenses < 0).length;

  const margins = jobs
    .filter(j => j.revenue > 0)
    .map(j => marginPercent(j.revenue, j.revenue - j.expenses));
  const averageMargin =
    margins.length > 0 ? margins.reduce((a, b) => a + b, 0) / margins.length : 0;

  return {
    revenue: revenueFromJobs,
    totalExpenses,
    grossProfit,
    netProfit,
    profitMargin,
    unpaidInvoiceTotal,
    completedNotInvoicedTotal,
    contractorPayoutTotal,
    jobsLosingMoneyCount,
    averageMargin,
  };
}

export function computeRevenuePerLeadSource(rows: LeadSourceRoiRow[]): LeadSourceRoiRow[] {
  return rows.map(row => ({
    ...row,
    revenue: row.revenue,
  }));
}

export function computeProfitPerLeadSource(rows: LeadSourceRoiRow[]): LeadSourceRoiRow[] {
  return rows;
}

export function buildCommandCenterFromRecords(input: {
  jobs: MetRepairJob[];
  invoices: MetRepairInvoice[];
  payments: MetRepairPayment[];
  expenses: MetRepairExpense[];
  contractors: MetRepairContractor[];
  prefetchedSummary?: Partial<MetRepairFinancialSummary>;
}): MetRepairCommandCenterSnapshot {
  const summary =
    input.prefetchedSummary && input.prefetchedSummary.revenue != null
      ? {
          revenue: input.prefetchedSummary.revenue ?? 0,
          totalExpenses: input.prefetchedSummary.totalExpenses ?? 0,
          grossProfit: input.prefetchedSummary.grossProfit ?? 0,
          netProfit: input.prefetchedSummary.netProfit ?? 0,
          profitMargin: input.prefetchedSummary.profitMargin ?? 0,
          unpaidInvoiceTotal: input.prefetchedSummary.unpaidInvoiceTotal ?? 0,
          completedNotInvoicedTotal: input.prefetchedSummary.completedNotInvoicedTotal ?? 0,
          contractorPayoutTotal: input.prefetchedSummary.contractorPayoutTotal ?? 0,
          jobsLosingMoneyCount: input.prefetchedSummary.jobsLosingMoneyCount ?? 0,
          averageMargin: input.prefetchedSummary.averageMargin ?? 0,
        }
      : computeFinancialSummary(input);

  const leadSourceRoi = computeLeadSourceRoi(input.jobs);
  const jobProfitability = computeJobProfitability(input.jobs);
  const contractorPayouts = computeContractorPayoutRows(input.jobs, input.contractors);

  const unpaidInvoices = input.invoices
    .filter(inv => inv.balance > 0.01)
    .sort((a, b) => {
      const da = a.dueDate ? new Date(a.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
      const db = b.dueDate ? new Date(b.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
      return da - db;
    });

  const alerts = buildMetRepairFinancialAlerts({
    jobs: input.jobs,
    invoices: input.invoices,
    summary,
    leadSourceRoi,
    jobProfitability,
    contractorPayouts,
  });

  return {
    fetchedAt: new Date().toISOString(),
    summary,
    leadSourceRoi,
    jobProfitability,
    contractorPayouts,
    unpaidInvoices,
    alerts,
    jobs: input.jobs,
  };
}
