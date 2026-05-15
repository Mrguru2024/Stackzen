import React from 'react';
import { render, screen } from '@testing-library/react';
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findFirst: jest.fn().mockResolvedValue({
        incomeHistory: [
          { id: 1, date: '2023-01-01', amount: 1000 },
          { id: 2, date: '2023-01-15', amount: 1500 },
        ],
        expenseHistory: [
          { id: 1, date: '2023-01-01', amount: 500 },
          { id: 2, date: '2023-01-15', amount: 750 },
        ],
      }),
    },
  },
}));
import FinancialSummary from './index.tsx';
describe('FinancialSummary', () => {
  it('renders summary stats and financial overview', async () => {
    render(<FinancialSummary />);
    expect(await screen.findByText(/Financial Summary/i)).toBeInTheDocument();
    expect(screen.getByText('$2500.00')).toBeInTheDocument(); // Total Income
    expect(screen.getByText('$1250.00')).toBeInTheDocument(); // Total Expenses
    expect(screen.getByText('$1250.00')).toBeInTheDocument(); // Savings
  });
  it('shows empty state if no financial data', async () => {
    jest.mock('@/lib/prisma', () => ({
      prisma: {
        user: { findFirst: jest.fn().mockResolvedValue({ incomeHistory: [], expenseHistory: [] }) },
      },
    }));
    render(<FinancialSummary />);
    expect(await screen.findByText(/Financial Summary/i)).toBeInTheDocument();
    expect(screen.getByText('$0.00')).toBeInTheDocument(); // Total Income
    expect(screen.getByText('$0.00')).toBeInTheDocument(); // Total Expenses
    expect(screen.getByText('$0.00')).toBeInTheDocument(); // Savings
  });
});
