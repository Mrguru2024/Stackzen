import React from 'react';
import { render, screen } from '@testing-library/react';
jest.mock('@/lib/prisma', () => ({
  prisma: {
    financialMilestone: {
      findMany: jest.fn().mockResolvedValue([
        {
          id: '1',
          name: 'First Paycheck',
          status: 'completed',
          date: new Date('2024-01-01'),
        },
      ]),
    },
  },
}));
import FinancialJourney from './index.tsx';
describe('FinancialJourney', () => {
  it('renders milestones and timeline', async () => {
    render(<FinancialJourney />);
    expect(await screen.findByText(/Financial Journey/i)).toBeInTheDocument();
    expect(screen.getByText('First Paycheck')).toBeInTheDocument();
    expect(screen.getByText(/completed/i)).toBeInTheDocument();
  });
  it('shows empty state if no milestones', async () => {
    jest.mock('@/lib/prisma', () => ({
      prisma: { financialMilestone: { findMany: jest.fn().mockResolvedValue([]) } },
    }));
    render(<FinancialJourney />);
    expect(await screen.findByText(/no milestones yet/i)).toBeInTheDocument();
  });
});
