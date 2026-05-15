import React from 'react';
import { render, screen } from '@testing-library/react';
jest.mock('@/lib/prisma', () => ({
  prisma: {
    income: {
      aggregate: jest.fn().mockResolvedValue({ _sum: { amount: 2000 } }),
      groupBy: jest
        .fn()
        .mockResolvedValue([{ date: new Date('2024-05-01'), _sum: { amount: 1000 } }]),
    },
    expense: {
      aggregate: jest.fn().mockResolvedValue({ _sum: { amount: 500 } }),
      groupBy: jest
        .fn()
        .mockResolvedValue([{ date: new Date('2024-05-01'), _sum: { amount: 200 } }]),
    },
  },
}));
import Reports from './index.tsx';
describe('Reports', () => {
  it('renders summary cards and monthly breakdown', async () => {
    render(<Reports />);
    expect(await screen.findByText(/Reports/i)).toBeInTheDocument();
    expect(screen.getByText(/Total Income/i)).toBeInTheDocument();
    expect(screen.getByText('$2000.00')).toBeInTheDocument();
    expect(screen.getByText(/Total Expenses/i)).toBeInTheDocument();
    expect(screen.getByText('$500.00')).toBeInTheDocument();
    expect(screen.getByText(/Net Savings/i)).toBeInTheDocument();
    expect(screen.getByText('$1500.00')).toBeInTheDocument();
    expect(screen.getByText('2024-05')).toBeInTheDocument();
  });
  it('shows empty state if no data', async () => {
    jest.mock('@/lib/prisma', () => ({
      prisma: {
        income: {
          aggregate: jest.fn().mockResolvedValue({ _sum: { amount: 0 } }),
          groupBy: jest.fn().mockResolvedValue([]),
        },
        expense: {
          aggregate: jest.fn().mockResolvedValue({ _sum: { amount: 0 } }),
          groupBy: jest.fn().mockResolvedValue([]),
        },
      },
    }));
    render(<Reports />);
    expect(await screen.findByText(/no data available/i)).toBeInTheDocument();
  });
});
