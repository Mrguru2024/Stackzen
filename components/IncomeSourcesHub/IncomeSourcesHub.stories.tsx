import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import IncomeSourcesHub from './index';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false, refetchOnWindowFocus: false },
  },
});

const meta: Meta<typeof IncomeSourcesHub> = {
  title: 'Income/IncomeSourcesHub',
  component: IncomeSourcesHub,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    Story => (
      <QueryClientProvider client={queryClient}>
        <div className="min-h-screen bg-background">
          <Story />
        </div>
      </QueryClientProvider>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof IncomeSourcesHub>;

export const Default: Story = {
  render: () => <IncomeSourcesHub />,
};

export const WithMockedData: Story = {
  render: () => <IncomeSourcesHub />,
  parameters: {
    mockData: [
      {
        url: '/api/income/sources',
        method: 'GET',
        status: 200,
        response: {
          plaidConfigured: true,
          bankConnections: [
            {
              id: 'b1',
              institutionName: 'Acme Bank',
              status: 'ACTIVE',
              lastSuccessfulSyncAt: new Date().toISOString(),
            },
          ],
          payoutChannelIds: ['cash_app', 'venmo', 'paypal'],
          customLabels: [],
        },
      },
      {
        url: '/api/income/summary',
        method: 'GET',
        status: 200,
        response: {
          totalIncome: 5320.45,
          averageIncome: 760.06,
          incomeByCategory: [
            { category: 'Bank deposits (synced)', amount: 3200 },
            { category: 'Manual: Cash App', amount: 1200 },
            { category: 'Manual: Tutoring', amount: 920.45 },
          ],
          totalBookings: 2,
          breakdown: {
            servicesBookings: 0,
            manualLedger: 2120.45,
            bankDepositsSynced: 3200,
          },
        },
      },
      {
        url: '/api/income/ledger',
        method: 'GET',
        status: 200,
        response: [
          {
            id: 'l1',
            amount: 250,
            date: new Date().toISOString(),
            source: 'Cash App',
            notes: 'Friday gig',
            createdAt: new Date().toISOString(),
          },
        ],
      },
      {
        url: '/api/cashflow/forecast',
        method: 'GET',
        status: 200,
        response: {
          generatedAt: new Date().toISOString(),
          windows: [
            { windowDays: 7, expectedIncomeTotal: 400 },
            { windowDays: 14, expectedIncomeTotal: 1100 },
            { windowDays: 30, expectedIncomeTotal: 2300 },
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
              sampleTransactionIds: ['t1'],
              nextExpectedDate: new Date(Date.now() + 7 * 86400000).toISOString(),
            },
          ],
          risks: [],
          explain: {
            assumptions: [],
            inputsUsed: { startingBalanceUsd: '1000.00' },
            confidence: 'medium',
          },
        },
      },
      {
        url: '/api/automation/rules',
        method: 'GET',
        status: 200,
        response: [
          {
            id: 'r1',
            name: 'Split paycheck',
            type: 'ALLOCATION',
            triggerType: 'PAYCHECK_DETECTED',
            enabled: true,
            priority: 1,
            actions: [
              { bucket: 'Reserve', percent: 30 },
              { bucket: 'Spending', percent: 70 },
            ],
          },
        ],
      },
      {
        url: '/api/operational-center/income-intelligence',
        method: 'GET',
        status: 200,
        response: {
          generatedAt: new Date().toISOString(),
          lookbackDays: 90,
          recurringIncome: [],
          concentration: {
            windowDays: 90,
            totalInflowUsd: 9000,
            herfindahlIndex: 0.32,
            topSources: [
              {
                seriesKey: 'paycheck',
                label: 'Acme Payroll',
                totalUsd: 5400,
                shareOfTotal: 0.6,
                transactionIdsSample: [],
              },
            ],
            reasoning: [],
          },
          delayedIncome: [],
          irregularPayouts: [],
          decliningPayouts: [],
          reserveNudges: [],
          forecastRiskCodes: [],
          explain: { assumptions: [], inputsUsed: {}, confidenceNotes: [] },
        },
      },
    ],
  },
};
