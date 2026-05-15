import React from 'react';
import { render, screen } from '@testing-library/react';
import Expenses from './index.tsx';
jest.mock('@/lib/prisma', () => ({
  prisma: {
    expense: {
      findMany: jest.fn().mockResolvedValue([
        {
          id: '1',
          description: 'Test',
          category: 'Food',
          amount: 10,
          date: new Date(),
          user: { name: 'User' },
        },
      ]),
    },
  },
}));

describe('Expenses', () => {
  it('renders table', async () => {
    const Expenses = (await import('./index')).default;
    render(<Expenses />);
    expect(await screen.findByText('Expenses')).toBeInTheDocument();
    expect(await screen.findByText('Test')).toBeInTheDocument();
  });
});
