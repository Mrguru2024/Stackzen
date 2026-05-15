import React from 'react';
import { render, screen } from '@testing-library/react';
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findFirst: jest.fn().mockResolvedValue({
        income: [{ amount: 1000 }],
        savings: { amount: 200, emergencyFundMonths: 4 },
        debt: { amount: 500 },
      }),
    },
  },
}));
import Scorecard from './index.tsx';
describe('Scorecard', () => {
  it('renders score and stats', async () => {
    render(<Scorecard />);
    expect(await screen.findByText(/Financial Scorecard/i)).toBeInTheDocument();
    expect(screen.getByText(/Score/i)).toBeInTheDocument();
    expect(screen.getByText(/1000.00/)).toBeInTheDocument();
    expect(screen.getByText(/20.0%/)).toBeInTheDocument();
    expect(screen.getByText(/500.00/)).toBeInTheDocument();
    expect(screen.getByText(/4 months/)).toBeInTheDocument();
  });
  it('shows empty state if no user', async () => {
    jest.mock('@/lib/prisma', () => ({
      prisma: { user: { findFirst: jest.fn().mockResolvedValue(null) } },
    }));
    render(<Scorecard />);
    expect(await screen.findByText(/no user data found/i)).toBeInTheDocument();
  });
});
