import React from 'react';
import { render, screen } from '@testing-library/react';
jest.mock('@/lib/prisma', () => ({
  prisma: {
    mentor: {
      findMany: jest.fn().mockResolvedValue([
        {
          id: '1',
          name: 'Jane Doe',
          expertise: 'Budgeting, Debt Management',
        },
      ]),
    },
  },
}));
import Mentorship from './index.tsx';
describe('Mentorship', () => {
  it('renders mentors and request button', async () => {
    render(<Mentorship />);
    expect(await screen.findByText(/Financial Mentorship/i)).toBeInTheDocument();
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    expect(screen.getByText(/Budgeting, Debt Management/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /request session with Jane Doe/i })
    ).toBeInTheDocument();
  });
  it('shows empty state if no mentors', async () => {
    jest.mock('@/lib/prisma', () => ({
      prisma: { mentor: { findMany: jest.fn().mockResolvedValue([]) } },
    }));
    render(<Mentorship />);
    expect(await screen.findByText(/no mentors available/i)).toBeInTheDocument();
  });
});
