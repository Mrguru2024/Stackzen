import React from 'react';
import { render, screen } from '@testing-library/react';
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findFirst: jest.fn().mockResolvedValue({
        aiInteractions: [
          { id: 1, message: 'Hello, how can I help you?' },
          { id: 2, message: 'I need some advice.' },
        ],
      }),
    },
  },
}));
import AICompanion from './index.tsx';
describe('AICompanion', () => {
  it('renders AI interaction history and chat interface', async () => {
    render(<AICompanion />);
    expect(await screen.findByText(/AI Companion/i)).toBeInTheDocument();
    expect(screen.getByText('Hello, how can I help you?')).toBeInTheDocument();
    expect(screen.getByText('I need some advice.')).toBeInTheDocument();
    expect(screen.getByText('Talk to a Mentor')).toBeInTheDocument();
  });
  it('shows empty state if no interactions', async () => {
    jest.mock('@/lib/prisma', () => ({
      prisma: { user: { findFirst: jest.fn().mockResolvedValue({ aiInteractions: [] }) } },
    }));
    render(<AICompanion />);
    expect(await screen.findByText(/No interactions yet/i)).toBeInTheDocument();
  });
});
