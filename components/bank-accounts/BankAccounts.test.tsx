import React from 'react';
import { render, screen } from '@testing-library/react';
jest.mock('@/lib/prisma', () => ({
  prisma: {
    bankAccount: {
      findMany: jest.fn().mockResolvedValue([
        {
          id: '1',
          bankName: 'Chase',
          accountName: 'Checking',
          type: 'Checking',
          status: 'Active',
          createdAt: new Date(),
        },
      ]),
    },
  },
}));
import BankAccounts from './index.tsx';
describe('BankAccounts', () => {
  it('renders bank accounts table and add button', async () => {
    render(<BankAccounts />);
    expect(await screen.findByText(/Bank Accounts/i)).toBeInTheDocument();
    expect(screen.getByText('Chase')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add bank account/i })).toBeInTheDocument();
  });
  it('shows empty state if no accounts', async () => {
    jest.mock('@/lib/prisma', () => ({
      prisma: { bankAccount: { findMany: jest.fn().mockResolvedValue([]) } },
    }));
    render(<BankAccounts />);
    expect(await screen.findByText(/no bank accounts connected/i)).toBeInTheDocument();
  });
});
