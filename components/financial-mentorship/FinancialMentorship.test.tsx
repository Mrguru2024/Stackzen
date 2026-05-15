import React from 'react';
import { render, screen } from '@testing-library/react';
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findFirst: jest.fn().mockResolvedValue({
        mentor: {
          id: 1,
          name: 'John Doe',
          email: 'john@example.com',
        },
      }),
    },
  },
}));
import FinancialMentorship from './index.tsx';
describe('FinancialMentorship', () => {
  it('renders mentor details and chat interface', async () => {
    render(<FinancialMentorship />);
    expect(await screen.findByText(/Financial Mentorship/i)).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
    expect(screen.getByText('Book Now')).toBeInTheDocument();
    expect(screen.getByText('Chat with Your Mentor')).toBeInTheDocument();
  });
  it('shows empty state if no mentor assigned', async () => {
    jest.mock('@/lib/prisma', () => ({
      prisma: { user: { findFirst: jest.fn().mockResolvedValue({ mentor: null }) } },
    }));
    render(<FinancialMentorship />);
    expect(await screen.findByText(/No Mentor Assigned/i)).toBeInTheDocument();
    expect(screen.getByText('Contact Support')).toBeInTheDocument();
  });
});
