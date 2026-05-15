import React from 'react';
import { render, screen } from '@testing-library/react';
jest.mock('@/lib/prisma', () => ({
  prisma: {
    income: {
      findMany: jest.fn().mockResolvedValue([
        {
          id: '1',
          description: 'Salary',
          amount: 1000,
          date: new Date(),
        },
      ]),
    },
    expense: {
      findMany: jest.fn().mockResolvedValue([
        {
          id: '2',
          description: 'Groceries',
          amount: 200,
          date: new Date(),
        },
      ]),
    },
  },
}));
import Transactions from './index.tsx';
describe('Transactions', () => {
  it('renders transactions table and filter dropdown', async () => {
    render(<Transactions />);
    expect(await screen.findByText(/Transactions/i)).toBeInTheDocument();
    expect(screen.getByText('Salary')).toBeInTheDocument();
    expect(screen.getByText('Groceries')).toBeInTheDocument();
    expect(screen.getByLabelText(/filter transactions by type/i)).toBeInTheDocument();
  });
  it('shows empty state if no transactions', async () => {
    jest.mock('@/lib/prisma', () => ({
      prisma: {
        income: { findMany: jest.fn().mockResolvedValue([]) },
        expense: { findMany: jest.fn().mockResolvedValue([]) },
      },
    }));
    render(<Transactions />);
    expect(await screen.findByText(/no transactions found/i)).toBeInTheDocument();
  });
});
