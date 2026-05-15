import React from 'react';
import { render, screen } from '@testing-library/react';
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findFirst: jest.fn().mockResolvedValue({
        savingsGoals: [
          { id: 1, name: 'Vacation', currentAmount: 500, targetAmount: 1000 },
          { id: 2, name: 'New Car', currentAmount: 2000, targetAmount: 5000 },
        ],
      }),
    },
  },
}));
import SavingsGoals from './index.tsx';
describe('SavingsGoals', () => {
  it('renders savings goals and progress bars', async () => {
    render(<SavingsGoals />);
    expect(await screen.findByText(/Savings Goals/i)).toBeInTheDocument();
    expect(screen.getByText('Vacation')).toBeInTheDocument();
    expect(screen.getByText('New Car')).toBeInTheDocument();
    expect(screen.getByText('$500.00 / $1000.00')).toBeInTheDocument();
    expect(screen.getByText('$2000.00 / $5000.00')).toBeInTheDocument();
  });
  it('shows empty state if no savings goals', async () => {
    jest.mock('@/lib/prisma', () => ({
      prisma: { user: { findFirst: jest.fn().mockResolvedValue({ savingsGoals: [] }) } },
    }));
    render(<SavingsGoals />);
    expect(await screen.findByText(/no savings goals found/i)).toBeInTheDocument();
  });
});
