import React from 'react';
import { render, screen } from '@testing-library/react';
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findFirst: jest.fn().mockResolvedValue({
        guardrails: [
          { id: 1, category: 'Groceries', limit: 400, alertEnabled: true },
          { id: 2, category: 'Dining Out', limit: 150, alertEnabled: false },
        ],
      }),
    },
  },
}));
import Guardrails from './index.tsx';
describe('Guardrails', () => {
  it('renders guardrails table, toggles, and summary', async () => {
    render(<Guardrails />);
    expect(await screen.findByText(/Spending Guardrails/i)).toBeInTheDocument();
    expect(screen.getByText('Groceries')).toBeInTheDocument();
    expect(screen.getByText('Dining Out')).toBeInTheDocument();
    expect(screen.getByDisplayValue('on')).toBeInTheDocument(); // Checkbox
    expect(screen.getByText(/Groceries: Limit \$400.00/i)).toBeInTheDocument();
    expect(screen.getByText(/Dining Out: Limit \$150.00/i)).toBeInTheDocument();
  });
  it('shows empty state if no guardrails', async () => {
    jest.mock('@/lib/prisma', () => ({
      prisma: { user: { findFirst: jest.fn().mockResolvedValue({ guardrails: [] }) } },
    }));
    render(<Guardrails />);
    expect(await screen.findByText(/no guardrails set/i)).toBeInTheDocument();
    expect(screen.getByText(/no guardrails configured/i)).toBeInTheDocument();
  });
});
