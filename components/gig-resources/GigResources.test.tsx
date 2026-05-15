import React from 'react';
import { render, screen } from '@testing-library/react';
jest.mock('@/lib/prisma', () => ({
  prisma: {
    gigCategory: {
      findMany: jest.fn().mockResolvedValue([
        {
          id: 1,
          name: 'Delivery',
          platforms: [
            { id: 1, name: 'DoorDash', description: 'Food delivery', url: 'https://doordash.com' },
          ],
        },
        {
          id: 2,
          name: 'Freelance',
          platforms: [
            { id: 2, name: 'Upwork', description: 'Freelance jobs', url: 'https://upwork.com' },
          ],
        },
      ]),
    },
  },
}));
import GigResources from './index.tsx';
describe('GigResources', () => {
  it('renders category filters and platform cards', async () => {
    render(<GigResources />);
    expect(await screen.findByText(/Gig Platforms & Resources/i)).toBeInTheDocument();
    expect(screen.getByText('Delivery')).toBeInTheDocument();
    expect(screen.getByText('Freelance')).toBeInTheDocument();
    expect(screen.getByText('DoorDash')).toBeInTheDocument();
    expect(screen.getByText('Upwork')).toBeInTheDocument();
    expect(screen.getByText('Food delivery')).toBeInTheDocument();
    expect(screen.getByText('Freelance jobs')).toBeInTheDocument();
  });
  it('shows empty state if no platforms', async () => {
    jest.mock('@/lib/prisma', () => ({
      prisma: { gigCategory: { findMany: jest.fn().mockResolvedValue([]) } },
    }));
    render(<GigResources />);
    expect(await screen.findByText(/no gig platforms found/i)).toBeInTheDocument();
  });
});
