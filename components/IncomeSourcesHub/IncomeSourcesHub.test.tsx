/* @jest-environment jsdom */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import IncomeSourcesHub from './index';

jest.mock('@/lib/hooks/use-plaid-bank-link', () => ({
  usePlaidBankLink: () => ({
    open: jest.fn(),
    ready: false,
    isLoadingLinkToken: false,
    error: null,
  }),
}));

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, refetchOnWindowFocus: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return {
    ok: init.status === undefined || init.status < 400,
    status: init.status ?? 200,
    json: async () => body,
  } as unknown as Response;
}

const fetchMock = jest.fn();

const sources = {
  plaidConfigured: true,
  bankConnections: [
    {
      id: 'b1',
      institutionName: 'Acme Bank',
      status: 'ACTIVE',
      lastSuccessfulSyncAt: new Date('2026-05-10T10:00:00Z').toISOString(),
    },
  ],
  payoutChannelIds: ['cash_app', 'venmo'],
  customLabels: [],
};

const summary = {
  totalIncome: 4250,
  averageIncome: 850,
  incomeByCategory: [
    { category: 'Bank deposits (synced)', amount: 2500 },
    { category: 'Manual: Cash App', amount: 1000 },
    { category: 'Manual: Tutoring', amount: 750 },
  ],
  totalBookings: 0,
  breakdown: {
    servicesBookings: 0,
    manualLedger: 1750,
    bankDepositsSynced: 2500,
  },
};

const ledger = [
  {
    id: 'l1',
    amount: 250,
    date: '2026-05-09',
    source: 'Cash App',
    notes: 'Friday gig',
    createdAt: '2026-05-09T20:00:00Z',
  },
];

const forecast = {
  generatedAt: '2026-05-11T00:00:00Z',
  windows: [
    {
      windowDays: 7,
      startingBalance: 1000,
      projectedEndingBalance: 1500,
      lowestProjectedBalance: 900,
      lowestProjectedBalanceDate: null,
      expectedIncomeTotal: 500,
      expectedBillsTotal: 0,
      expectedAllocationImpactTotal: 0,
      riskLevel: 'low',
      events: [],
    },
    {
      windowDays: 14,
      startingBalance: 1000,
      projectedEndingBalance: 1800,
      lowestProjectedBalance: 900,
      lowestProjectedBalanceDate: null,
      expectedIncomeTotal: 800,
      expectedBillsTotal: 0,
      expectedAllocationImpactTotal: 0,
      riskLevel: 'low',
      events: [],
    },
    {
      windowDays: 30,
      startingBalance: 1000,
      projectedEndingBalance: 2700,
      lowestProjectedBalance: 900,
      lowestProjectedBalanceDate: null,
      expectedIncomeTotal: 1700,
      expectedBillsTotal: 0,
      expectedAllocationImpactTotal: 0,
      riskLevel: 'low',
      events: [],
    },
  ],
  recurringObligations: [],
  recurringIncome: [
    {
      key: 'paycheck',
      direction: 'INFLOW',
      label: 'Acme Payroll',
      medianAmount: 1700,
      cadence: 'biweekly',
      medianIntervalDays: 14,
      occurrences: 6,
      confidence: 0.92,
      sampleTransactionIds: ['t1', 't2'],
      nextExpectedDate: '2026-05-20T00:00:00Z',
    },
  ],
  risks: [],
  explain: {
    assumptions: [],
    inputsUsed: { startingBalanceUsd: '1000.00' },
    confidence: 'medium',
  },
};

const rules = [
  {
    id: 'r1',
    userId: 'u1',
    name: 'Split paycheck',
    type: 'ALLOCATION',
    triggerType: 'PAYCHECK_DETECTED',
    enabled: true,
    priority: 1,
    actions: [
      { bucket: 'Reserve', percent: 30 },
      { bucket: 'Spending', percent: 70 },
    ],
    conditions: null,
    schedule: null,
    premiumRequired: false,
    createdAt: '2026-05-01T00:00:00Z',
    updatedAt: '2026-05-01T00:00:00Z',
  },
];

const intel = {
  generatedAt: '2026-05-11T00:00:00Z',
  lookbackDays: 90,
  recurringIncome: [],
  concentration: {
    windowDays: 90,
    totalInflowUsd: 9000,
    herfindahlIndex: 0.32,
    topSources: [{ seriesKey: 'paycheck', label: 'Acme Payroll', totalUsd: 5400, shareOfTotal: 0.6, transactionIdsSample: [] }],
    reasoning: [],
  },
  delayedIncome: [],
  irregularPayouts: [],
  decliningPayouts: [],
  reserveNudges: [],
  forecastRiskCodes: [],
  explain: {
    assumptions: [],
    inputsUsed: {},
    confidenceNotes: [],
  },
};

describe('IncomeSourcesHub', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockImplementation((input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input.toString();
      if (url.startsWith('/api/income/sources')) return Promise.resolve(jsonResponse(sources));
      if (url.startsWith('/api/income/summary')) return Promise.resolve(jsonResponse(summary));
      if (url.startsWith('/api/income/ledger')) return Promise.resolve(jsonResponse(ledger));
      if (url.startsWith('/api/cashflow/forecast')) return Promise.resolve(jsonResponse(forecast));
      if (url.startsWith('/api/automation/rules')) return Promise.resolve(jsonResponse(rules));
      if (url.startsWith('/api/operational-center/income-intelligence'))
        return Promise.resolve(jsonResponse(intel));
      if (url.startsWith('/api/bank/link-token'))
        return Promise.resolve(jsonResponse({ link_token: 'tok_test' }));
      return Promise.resolve(jsonResponse({ error: 'not mocked' }, { status: 404 }));
    });
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  it('renders the header and KPI grid after data loads', async () => {
    renderWithClient(<IncomeSourcesHub />);

    expect(
      screen.getByRole('heading', { level: 1, name: /income sources/i }),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('$4,250.00')).toBeInTheDocument();
    });

    expect(screen.getByText(/Income this month/i)).toBeInTheDocument();
    expect(screen.getByText(/Expected \(next 30 days\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Sources connected/i)).toBeInTheDocument();
  });

  it('shows source breakdown rows from the summary', async () => {
    renderWithClient(<IncomeSourcesHub />);

    await waitFor(() => {
      expect(screen.getByText('Bank deposits (synced)')).toBeInTheDocument();
    });

    expect(screen.getByText('Manual: Cash App')).toBeInTheDocument();
    expect(screen.getByText('Manual: Tutoring')).toBeInTheDocument();
  });

  it('exposes navigation links to cash flow and money control', async () => {
    renderWithClient(<IncomeSourcesHub />);

    await waitFor(() => {
      expect(screen.getByRole('link', { name: /cash flow/i })).toBeInTheDocument();
    });

    const automationLink = screen.getByRole('link', { name: /automations/i });
    expect(automationLink).toHaveAttribute('href', '/money-control?tab=rules');
  });
});
