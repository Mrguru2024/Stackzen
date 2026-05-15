import React from 'react';
import { render, screen } from '@testing-library/react';
jest.mock('@/lib/prisma', () => ({
  prisma: {
    membershipTier: {
      findMany: jest.fn().mockResolvedValue([
        { id: 1, name: 'Free', price: 0, features: ['Basic tracking'] },
        { id: 2, name: 'Pro', price: 10, features: ['Advanced analytics', 'Priority support'] },
      ]),
    },
    user: {
      findFirst: jest.fn().mockResolvedValue({ membershipTierId: 1 }),
    },
  },
}));
import MembershipTiers from './index.tsx';
const { prisma } = require('@/lib/prisma');

describe('MembershipTiers', () => {
  it('renders tiers, current plan, and upgrade button', async () => {
    render(<MembershipTiers />);
    expect(await screen.findByText(/Membership Tiers/i)).toBeInTheDocument();
    expect(screen.getByText('Free')).toBeInTheDocument();
    expect(screen.getByText('Pro')).toBeInTheDocument();
    expect(screen.getByText('Current Plan')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Upgrade to Pro/i })).toBeInTheDocument();
  });
  it('shows empty state if no tiers', async () => {
    prisma.membershipTier.findMany.mockImplementationOnce(() => Promise.resolve([]));
    prisma.user.findFirst.mockImplementationOnce(() => Promise.resolve({}));
    render(<MembershipTiers />);
    expect(await screen.queryByText('Current Plan')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Upgrade/i })).not.toBeInTheDocument();
  });
});
