/* @jest-environment jsdom */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import CashFlowView from './index';

describe('CashFlowView', () => {
  beforeEach(() => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({
          generatedAt: new Date().toISOString(),
          windows: [
            {
              windowDays: 7,
              startingBalance: 1000,
              projectedEndingBalance: 800,
              lowestProjectedBalance: 800,
              lowestProjectedBalanceDate: null,
              expectedIncomeTotal: 0,
              expectedBillsTotal: 200,
              expectedAllocationImpactTotal: 0,
              riskLevel: 'low',
              events: [],
            },
            {
              windowDays: 14,
              startingBalance: 1000,
              projectedEndingBalance: 700,
              lowestProjectedBalance: 700,
              lowestProjectedBalanceDate: null,
              expectedIncomeTotal: 0,
              expectedBillsTotal: 300,
              expectedAllocationImpactTotal: 0,
              riskLevel: 'medium',
              events: [],
            },
            {
              windowDays: 30,
              startingBalance: 1000,
              projectedEndingBalance: 600,
              lowestProjectedBalance: 600,
              lowestProjectedBalanceDate: null,
              expectedIncomeTotal: 0,
              expectedBillsTotal: 400,
              expectedAllocationImpactTotal: 0,
              riskLevel: 'medium',
              events: [],
            },
          ],
          recurringObligations: [],
          recurringIncome: [],
          risks: [],
          explain: {
            assumptions: [],
            inputsUsed: { startingBalanceUsd: '1000.00' },
            confidence: 'medium',
          },
        }),
      })
    ) as unknown as jest.Mock;
  });

  it('renders forecast headline after load', async () => {
    render(<CashFlowView />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /cash flow intelligence/i })).toBeInTheDocument();
    });
  });
});
