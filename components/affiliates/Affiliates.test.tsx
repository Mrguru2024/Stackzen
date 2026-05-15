import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findFirst: jest.fn().mockResolvedValue({
        affiliate: {
          code: 'REF123',
          signups: 5,
          earnings: 50,
        },
      }),
    },
  },
}));
Object.assign(navigator, { clipboard: { writeText: jest.fn() } });
import Affiliates from './index.tsx';
describe('Affiliates', () => {
  it('renders referral code, stats, and copy button', async () => {
    render(<Affiliates />);
    expect(await screen.findByText(/Referral & Affiliates/i)).toBeInTheDocument();
    expect(screen.getByTestId('referral-code')).toHaveTextContent('REF123');
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('$50.00')).toBeInTheDocument();
    const copyBtn = screen.getByRole('button', { name: /copy referral code/i });
    fireEvent.click(copyBtn);
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('REF123');
  });
  it('shows N/A and 0 stats if no affiliate', async () => {
    jest.mock('@/lib/prisma', () => ({
      prisma: { user: { findFirst: jest.fn().mockResolvedValue({}) } },
    }));
    render(<Affiliates />);
    expect(await screen.findByTestId('referral-code')).toHaveTextContent('N/A');
    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getByText('$0.00')).toBeInTheDocument();
  });
});
