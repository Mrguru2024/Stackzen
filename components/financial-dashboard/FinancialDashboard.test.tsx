import React from 'react';
import { render, screen } from '@testing-library/react';
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findFirst: jest.fn().mockResolvedValue({
        incomeHistory: [{ id: 1, amount: 1000 }],
        expenseHistory: [{ id: 1, amount: 500 }],
        budget: [{ id: 1, amount: 1500 }],
        savingsGoals: [
          { id: 1, name: 'Vacation', currentAmount: 500, targetAmount: 1000 },
          { id: 2, name: 'New Car', currentAmount: 2000, targetAmount: 5000 },
        ],
      }),
    },
  },
}));
import FinancialDashboard from './index.tsx';
describe('FinancialDashboard', () => {
  it('renders financial summary and savings goals', async () => {
    render(<FinancialDashboard />);
    expect(await screen.findByText(/Financial Dashboard/i)).toBeInTheDocument();
    expect(screen.getByText('Total Income: $1000.00')).toBeInTheDocument();
    expect(screen.getByText('Total Expenses: $500.00')).toBeInTheDocument();
    expect(screen.getByText('Total Budget: $1500.00')).toBeInTheDocument();
    expect(screen.getByText('Total Savings: $2500.00')).toBeInTheDocument();
    expect(screen.getByText('$500.00 / $1000.00 - Vacation')).toBeInTheDocument();
    expect(screen.getByText('$2000.00 / $5000.00 - New Car')).toBeInTheDocument();
    expect(screen.getByText('Add Savings Goal')).toBeInTheDocument();
  });
  it('shows empty state if no savings goals', async () => {
    jest.mock('@/lib/prisma', () => ({
      prisma: { user: { findFirst: jest.fn().mockResolvedValue({ savingsGoals: [] }) } },
    }));
    render(<FinancialDashboard />);
    expect(await screen.findByText(/No savings goals yet/i)).toBeInTheDocument();
  });
});
