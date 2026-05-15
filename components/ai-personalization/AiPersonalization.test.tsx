import React from 'react';
import { render, screen } from '@testing-library/react';
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findFirst: jest.fn().mockResolvedValue({
        aiMemoryEnabled: true,
        aiOptOut: false,
        aiUsageLog: [
          { id: 1, input: 'How can I save more?', output: 'Try setting a savings goal.' },
        ],
      }),
    },
  },
}));
import AiPersonalization from './index.tsx';
describe('AiPersonalization', () => {
  it('renders toggles, interaction history, and explain link', async () => {
    render(<AiPersonalization />);
    expect(await screen.findByText(/AI Personalization & Privacy/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Toggle AI memory/i)).toBeChecked();
    expect(screen.getByLabelText(/Opt out of AI financial support/i)).not.toBeChecked();
    expect(screen.getByText('How can I save more?')).toBeInTheDocument();
    expect(screen.getByText('AI: Try setting a savings goal.')).toBeInTheDocument();
    expect(screen.getByText(/Explain This Suggestion/i)).toBeInTheDocument();
  });
  it('shows empty state if no logs', async () => {
    jest.mock('@/lib/prisma', () => ({
      prisma: { user: { findFirst: jest.fn().mockResolvedValue({ aiUsageLog: [] }) } },
    }));
    render(<AiPersonalization />);
    expect(await screen.findByText(/no ai interactions found/i)).toBeInTheDocument();
  });
});
