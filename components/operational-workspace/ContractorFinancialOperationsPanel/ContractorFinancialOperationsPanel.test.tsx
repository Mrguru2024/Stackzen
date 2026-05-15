import { render, screen, waitFor } from '@testing-library/react';
import ContractorFinancialOperationsPanel from '@/components/operational-workspace/ContractorFinancialOperationsPanel';
import type { ContractorFinancialOpsSnapshotDto } from '@/lib/contractor-operations/types';

const emptySnap: ContractorFinancialOpsSnapshotDto = {
  generatedAt: new Date().toISOString(),
  hasContractorContext: false,
  jobsSample: [],
  materialExposure: [],
  negativeMarginJobs: [],
  openReceivables: [],
  receivableConcentration: {
    openInvoiceCount: 0,
    totalOpenUsd: 0,
    herfindahlIndex: 0,
    topClients: [],
    reasoning: [],
  },
  latePayerClients: [],
  collectionTiming: {
    windowDays: 14,
    upcomingWithinWindowCount: 0,
    meanDaysUntilDue: null,
    stdevDaysUntilDue: null,
    reasoning: ['No unpaid invoices with due dates in the next 14 calendar days (local day comparison).'],
  },
  reserveNudges: [],
  forecastRiskCodes: [],
  explain: { assumptions: [], inputsUsed: {} },
};

describe('ContractorFinancialOperationsPanel', () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => emptySnap,
    } as Response);
  });

  it('shows idle copy when no contractor context', async () => {
    render(<ContractorFinancialOperationsPanel />);
    await waitFor(() => {
      expect(screen.getByText(/No jobs or open invoices on file/i)).toBeInTheDocument();
    });
  });
});
