import React from 'react';
import { render, screen } from '@testing-library/react';
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findFirst: jest.fn().mockResolvedValue({
        budget: [
          { id: 1, amount: 500, category: 'Food' },
          { id: 2, amount: 1000, category: 'Rent' },
        ],
      }),
    },
  },
}));
import BudgetPlanner from './index.tsx';
describe('BudgetPlanner', () => {
  it('renders budget summary and breakdown', async () => {
    render(<BudgetPlanner />);
    expect(await screen.findByText(/Budget Planner/i)).toBeInTheDocument();
    expect(screen.getByText('Total Budget: $1500.00')).toBeInTheDocument();
    expect(screen.getByText('$500.00 - Food')).toBeInTheDocument();
    expect(screen.getByText('$1000.00 - Rent')).toBeInTheDocument();
    expect(screen.getByText('Add Budget Item')).toBeInTheDocument();
  });
  it('shows empty state if no budget items', async () => {
    jest.mock('@/lib/prisma', () => ({
      prisma: { user: { findFirst: jest.fn().mockResolvedValue({ budget: [] }) } },
    }));
    render(<BudgetPlanner />);
    expect(await screen.findByText(/No budget items yet/i)).toBeInTheDocument();
  });
});
