import React from 'react';
import { render, screen } from '@testing-library/react';
jest.mock('@/lib/prisma', () => ({
  prisma: {
    savingsChallenge: {
      findMany: jest.fn().mockResolvedValue([
        {
          id: '1',
          title: 'Emergency Fund',
          currentAmount: 500,
          targetAmount: 1000,
          createdAt: new Date(),
        },
      ]),
    },
  },
}));
import SavingsChallenges from './index.tsx';
describe('SavingsChallenges', () => {
  it('renders savings challenges and progress bar', async () => {
    render(<SavingsChallenges />);
    expect(await screen.findByText(/Savings Challenges/i)).toBeInTheDocument();
    expect(screen.getByText('Emergency Fund')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /start new challenge/i })).toBeInTheDocument();
    expect(screen.getByText(/50%/i)).toBeInTheDocument();
  });
  it('shows empty state if no challenges', async () => {
    jest.mock('@/lib/prisma', () => ({
      prisma: { savingsChallenge: { findMany: jest.fn().mockResolvedValue([]) } },
    }));
    render(<SavingsChallenges />);
    expect(await screen.findByText(/no savings challenges yet/i)).toBeInTheDocument();
  });
});
