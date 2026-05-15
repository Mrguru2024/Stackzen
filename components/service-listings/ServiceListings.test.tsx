import React from 'react';
import { render, screen } from '@testing-library/react';
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findFirst: jest.fn().mockResolvedValue({
        services: [
          { id: 1, title: 'Web Design', category: 'Design', status: 'active' },
          { id: 2, title: 'Bookkeeping', category: 'Finance', status: 'inactive' },
        ],
      }),
    },
  },
}));
import ServiceListings from './index.tsx';
const { prisma } = require('@/lib/prisma');

describe('ServiceListings', () => {
  it('renders services table and add button', async () => {
    render(<ServiceListings />);
    expect(await screen.findByText(/My Service Listings/i)).toBeInTheDocument();
    expect(screen.getByText('Web Design')).toBeInTheDocument();
    expect(screen.getByText('Bookkeeping')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add new service/i })).toBeInTheDocument();
  });
  it('shows empty state if no services', async () => {
    prisma.user.findFirst.mockImplementationOnce(() => Promise.resolve({ services: [] }));
    render(<ServiceListings />);
    expect(await screen.findByText(/no services posted yet/i)).toBeInTheDocument();
  });
});
