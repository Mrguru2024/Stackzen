import type {
  ContractorPayoutRow,
  JobProfitabilityRow,
  LeadSourceRoiRow,
  MetRepairFinancialAlert,
  MetRepairFinancialSummary,
  MetRepairInvoice,
  MetRepairJob,
} from '@/lib/integrations/met-repairs/types';

const COMPLETED = new Set(['COMPLETED', 'COMPLETE', 'DONE', 'CLOSED']);

function isCompleted(status: string): boolean {
  return COMPLETED.has(status.toUpperCase());
}

function isOverdue(invoice: MetRepairInvoice): boolean {
  if (!invoice.dueDate) return false;
  if (invoice.balance <= 0.01) return false;
  const due = new Date(invoice.dueDate);
  return !Number.isNaN(due.getTime()) && due.getTime() < Date.now();
}

function isUnpaid(invoice: MetRepairInvoice): boolean {
  return invoice.balance > 0.01 && !['PAID', 'VOID'].includes(invoice.status.toUpperCase());
}

export function buildMetRepairFinancialAlerts(input: {
  jobs: MetRepairJob[];
  invoices: MetRepairInvoice[];
  summary: MetRepairFinancialSummary;
  leadSourceRoi: LeadSourceRoiRow[];
  jobProfitability: JobProfitabilityRow[];
  contractorPayouts: ContractorPayoutRow[];
}): MetRepairFinancialAlert[] {
  const alerts: MetRepairFinancialAlert[] = [];
  let seq = 0;
  const id = (prefix: string) => `met-alert-${prefix}-${++seq}`;

  for (const job of input.jobs) {
    if (isCompleted(job.status) && !job.invoicedAt) {
      const hasInvoice = input.invoices.some(inv => inv.jobId === job.id);
      if (!hasInvoice) {
        alerts.push({
          id: id('completed-not-invoiced'),
          severity: 'warning',
          title: 'Completed work not invoiced',
          reason: `${job.workOrderLabel} for ${job.clientName} is complete but has no linked invoice.`,
          recommendedAction:
            'Create or link an invoice in MET Repairs OS so revenue is captured in your books.',
          entityType: 'job',
          entityId: job.id,
        });
      }
    }
  }

  for (const invoice of input.invoices) {
    if (isUnpaid(invoice)) {
      alerts.push({
        id: id('unpaid'),
        severity: 'warning',
        title: 'Unpaid invoice',
        reason: `${invoice.invoiceLabel} for ${invoice.clientName} has an open balance of ${invoice.balance.toFixed(2)}.`,
        recommendedAction: 'Send a reminder or review payment status in MET Repairs OS.',
        entityType: 'invoice',
        entityId: invoice.id,
      });
    }
    if (isOverdue(invoice)) {
      alerts.push({
        id: id('overdue'),
        severity: 'critical',
        title: 'Invoice overdue',
        reason: `${invoice.invoiceLabel} was due ${invoice.dueDate} and remains unpaid.`,
        recommendedAction: 'Prioritize collections or adjust payment terms with the client.',
        entityType: 'invoice',
        entityId: invoice.id,
      });
    }
  }

  for (const row of input.jobProfitability) {
    if (row.netProfit < 0) {
      alerts.push({
        id: id('losing'),
        severity: 'critical',
        title: 'Job losing money',
        reason: `${row.workOrderLabel} shows expenses above revenue (${row.netProfit.toFixed(2)} net).`,
        recommendedAction: 'Review scope, materials, and contractor costs before taking similar jobs.',
        entityType: 'job',
        entityId: row.jobId,
      });
    } else if (row.margin < 30 && row.revenue > 0) {
      alerts.push({
        id: id('low-margin'),
        severity: 'warning',
        title: 'Below target margin',
        reason: `${row.workOrderLabel} margin is ${row.margin.toFixed(1)}%, under the 30% threshold.`,
        recommendedAction: 'Validate pricing, change orders, and material usage for this job.',
        entityType: 'job',
        entityId: row.jobId,
      });
    }
  }

  for (const row of input.leadSourceRoi) {
    if (row.leadCost > 0 && row.roi < 0) {
      alerts.push({
        id: id('roi'),
        severity: 'warning',
        title: 'Lead source negative ROI',
        reason: `${row.leadSource} spent ${row.leadCost.toFixed(2)} on leads but net profit is ${row.netProfit.toFixed(2)}.`,
        recommendedAction: 'Pause or renegotiate spend on this channel until conversion improves.',
        entityType: 'lead_source',
        entityId: row.leadSource,
      });
    }
  }

  for (const contractor of input.contractorPayouts) {
    const relatedJobs = input.jobs.filter(j => j.contractorId === contractor.contractorId);
    const relatedRevenue = relatedJobs.reduce((sum, j) => sum + j.revenue, 0);
    if (relatedRevenue > 0 && contractor.totalPayout > relatedRevenue * 0.55) {
      alerts.push({
        id: id('payout'),
        severity: 'warning',
        title: 'Contractor payout elevated',
        reason: `${contractor.contractorName} payouts are high relative to attributed job revenue.`,
        recommendedAction: 'Confirm payout rates and job attribution in MET Repairs OS.',
        entityType: 'contractor',
        entityId: contractor.contractorId,
      });
    }
  }

  for (const job of input.jobs) {
    const materialHeavy = job.materialCost > job.revenue * 0.4;
    const depositMissing = job.depositReceived <= 0 && job.materialCost > 500;
    if (materialHeavy && depositMissing && !isCompleted(job.status)) {
      alerts.push({
        id: id('deposit'),
        severity: 'info',
        title: 'Deposit missing on material-heavy job',
        reason: `${job.workOrderLabel} has significant material cost without a recorded deposit.`,
        recommendedAction: 'Collect a deposit in MET Repairs OS before ordering materials.',
        entityType: 'job',
        entityId: job.id,
      });
    }
  }

  const severityRank: Record<MetRepairFinancialAlert['severity'], number> = {
    critical: 0,
    warning: 1,
    info: 2,
  };

  return alerts.sort((a, b) => severityRank[a.severity] - severityRank[b.severity]);
}
