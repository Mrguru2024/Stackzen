import React from 'react';
import { render, screen } from '@testing-library/react';
import Income from './index.tsx';
jest.mock('@/lib/prisma', () => ({
  prisma: {
    income: {
      findMany: jest.fn().mockResolvedValue([
        {
          id: '1',
          description: 'Salary',
          source: 'Job',
          amount: 1000,
          date: new Date(),
          user: { name: 'User' },
        },
      ]),
    },
  },
}));

describe('Income', () => {
  it('renders table', async () => {
    const Income = (await import('./index')).default;
    render(<Income />);
    expect(await screen.findByText('Income')).toBeInTheDocument();
    expect(await screen.findByText('Salary')).toBeInTheDocument();
  });
});
