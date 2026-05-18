import { buildMetRepairFinancialAlerts } from '@/lib/integrations/met-repairs/alerts';
import { computeFinancialSummary, computeJobProfitability, computeLeadSourceRoi } from '@/lib/integrations/met-repairs/financial-calculations';
import type { MetRepairJob } from '@/lib/integrations/met-repairs/types';

describe('buildMetRepairFinancialAlerts', () => {
  it('flags completed but not invoiced jobs', () => {
    const jobs: MetRepairJob[] = [
      {
        id: 'j1',
        workOrderLabel: 'WO-1',
        clientName: 'A',
        status: 'COMPLETED',
        revenue: 1000,
        expenses: 400,
        leadSource: null,
        leadCost: 0,
        completedAt: '2026-01-01',
        invoicedAt: null,
        depositReceived: 0,
        materialCost: 0,
        contractorId: null,
        contractorName: null,
      },
    ];
    const summary = computeFinancialSummary({
      jobs,
      invoices: [],
      expenses: [],
      contractors: [],
      payments: [],
    });
    const alerts = buildMetRepairFinancialAlerts({
      jobs,
      invoices: [],
      summary,
      leadSourceRoi: computeLeadSourceRoi(jobs),
      jobProfitability: computeJobProfitability(jobs),
      contractorPayouts: [],
    });
    expect(alerts.some(a => a.title.includes('not invoiced'))).toBe(true);
  });
});
