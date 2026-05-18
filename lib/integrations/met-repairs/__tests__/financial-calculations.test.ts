import {
  buildCommandCenterFromRecords,
  computeFinancialSummary,
  computeLeadSourceRoi,
} from '@/lib/integrations/met-repairs/financial-calculations';
import type { MetRepairJob } from '@/lib/integrations/met-repairs/types';

const jobs: MetRepairJob[] = [
  {
    id: 'job-1',
    workOrderLabel: 'WO-100',
    clientName: 'Acme LLC',
    status: 'COMPLETED',
    revenue: 10000,
    expenses: 6000,
    leadSource: 'Google',
    leadCost: 500,
    completedAt: '2026-01-01',
    invoicedAt: null,
    depositReceived: 0,
    materialCost: 2000,
    contractorId: 'c1',
    contractorName: 'Pat',
  },
  {
    id: 'job-2',
    workOrderLabel: 'WO-101',
    clientName: 'Beta Inc',
    status: 'PAID',
    revenue: 5000,
    expenses: 5500,
    leadSource: 'Referral',
    leadCost: 0,
    completedAt: '2026-01-02',
    invoicedAt: '2026-01-03',
    depositReceived: 1000,
    materialCost: 500,
    contractorId: null,
    contractorName: null,
  },
];

describe('computeFinancialSummary', () => {
  it('calculates profit metrics', () => {
    const summary = computeFinancialSummary({
      jobs,
      invoices: [
        {
          id: 'inv-1',
          invoiceLabel: 'INV-1',
          clientName: 'Acme LLC',
          jobId: 'job-1',
          total: 10000,
          paid: 0,
          balance: 10000,
          dueDate: '2026-01-10',
          status: 'SENT',
        },
      ],
      expenses: [{ id: 'exp-1', amount: 200, jobId: 'job-1', category: 'fuel', description: null, incurredAt: null }],
      contractors: [{ id: 'c1', name: 'Pat', jobsCompleted: 1, totalPayout: 3900, reliabilityScore: 4.5 }],
      payments: [],
    });

    expect(summary.revenue).toBe(15000);
    expect(summary.totalExpenses).toBe(11700);
    expect(summary.grossProfit).toBe(3300);
    expect(summary.netProfit).toBe(2800);
    expect(summary.jobsLosingMoneyCount).toBe(1);
    expect(summary.unpaidInvoiceTotal).toBe(10000);
  });
});

describe('computeLeadSourceRoi', () => {
  it('computes ROI per source', () => {
    const rows = computeLeadSourceRoi(jobs);
    const google = rows.find(r => r.leadSource === 'GOOGLE');
    expect(google?.closedJobs).toBe(1);
    expect(google?.roi).toBeGreaterThan(0);
  });
});

describe('buildCommandCenterFromRecords', () => {
  it('returns snapshot with alerts', () => {
    const snapshot = buildCommandCenterFromRecords({
      jobs,
      invoices: [],
      payments: [],
      expenses: [],
      contractors: [],
    });
    expect(snapshot.leadSourceRoi.length).toBeGreaterThan(0);
    expect(snapshot.jobProfitability.length).toBe(2);
    expect(Array.isArray(snapshot.alerts)).toBe(true);
  });
});
