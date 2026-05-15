import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { render, screen, fireEvent, act } from '@testing-library/react';
import GoalNotifications from './GoalNotifications.tsx';
import { CategoryGoal } from '@/lib/types/wellness';

// Mock the confetti utility
jest.mock('@/lib/utils/confetti', () => ({
  triggerConfetti: jest.fn(),
}));

// Mock date-fns
jest.mock('date-fns', () => ({
  formatDistanceToNow: jest.fn(() => '2 days left'),
}));

// Mock next-auth
jest.mock('next-auth/react', () => ({
  useSession: () => ({
    data: {
      user: {
        email: 'test@example.com',
      },
    },
  }),
}));

// Mock @tanstack/react-virtual
jest.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: () => ({
    getVirtualItems: () => [
      { index: 0, start: 0, size: 120 },
      { index: 1, start: 120, size: 120 },
      { index: 2, start: 240, size: 120 },
    ],
    getTotalSize: () => 360,
    scrollToIndex: jest.fn(),
  }),
}));

describe('GoalNotifications', () => {
  const mockGoals: CategoryGoal[] = [
    {
      id: '1',
      category: 'savings',
      name: 'Emergency Fund',
      target: 10000,
      current: 10000,
      deadline: new Date('2024-12-31').toISOString(),
      completed: false,
    },
    {
      id: '2',
      category: 'investments',
      name: 'Stock Portfolio',
      target: 50000,
      current: 25000,
      deadline: new Date('2024-06-30').toISOString(),
      completed: false,
    },
    {
      id: '3',
      category: 'debt',
      name: 'Credit Card Payoff',
      target: 8000,
      current: 4000,
      deadline: new Date('2024-09-30').toISOString(),
      completed: false,
    },
  ];

  const mockOnDismiss = jest.fn();
  const mockFetch = jest.fn().mockResolvedValue({ ok: true });
  global.fetch = mockFetch;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders completed goal notification', () => {
    render(<GoalNotifications goals={[mockGoals[0]]} onDismiss={mockOnDismiss} />);

    expect(screen.getByText('🎉 Goal Completed!')).toBeInTheDocument();
    expect(screen.getByText('Emergency Fund')).toBeInTheDocument();
    expect(screen.getByText('Target: $10,000')).toBeInTheDocument();
  });

  it('renders upcoming deadline notification', () => {
    // Mock current date to be within 7 days of deadline
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-06-28'));

    render(<GoalNotifications goals={[mockGoals[1]]} onDismiss={mockOnDismiss} />);

    expect(screen.getByText('⏰ Deadline Approaching')).toBeInTheDocument();
    expect(screen.getByText('Stock Portfolio')).toBeInTheDocument();
    expect(screen.getByText('$25,000 / $50,000')).toBeInTheDocument();
    expect(screen.getByText('2 days left')).toBeInTheDocument();

    jest.useRealTimers();
  });

  it('renders milestone notification at 50% completion', () => {
    render(<GoalNotifications goals={[mockGoals[2]]} onDismiss={mockOnDismiss} />);

    expect(screen.getByText('🎯 Milestone Achieved!')).toBeInTheDocument();
    expect(screen.getByText('Credit Card Payoff')).toBeInTheDocument();
    expect(screen.getByText('$4,000 / $8,000')).toBeInTheDocument();
    expect(screen.getByText('50% Complete')).toBeInTheDocument();
  });

  it('calls onDismiss when dismiss button is clicked', () => {
    render(<GoalNotifications goals={[mockGoals[0]]} onDismiss={mockOnDismiss} />);

    const dismissButton = screen.getByLabelText('Dismiss Emergency Fund notification');
    fireEvent.click(dismissButton);

    expect(mockOnDismiss).toHaveBeenCalledWith('1');
  });

  it('applies custom className when provided', () => {
    const customClass = 'custom-notifications';
    render(
      <GoalNotifications goals={[mockGoals[0]]} onDismiss={mockOnDismiss} className={customClass} />
    );

    const container = screen.getByText('🎉 Goal Completed!').closest('div');
    expect(container?.parentElement).toHaveClass(customClass);
  });

  it('does not render when there are no notifications', () => {
    const { container } = render(<GoalNotifications goals={[]} onDismiss={mockOnDismiss} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('handles multiple notifications of different types', () => {
    render(<GoalNotifications goals={mockGoals} onDismiss={mockOnDismiss} />);

    expect(screen.getByText('🎉 Goal Completed!')).toBeInTheDocument();
    expect(screen.getByText('Emergency Fund')).toBeInTheDocument();
    expect(screen.getByText('🎯 Milestone Achieved!')).toBeInTheDocument();
    expect(screen.getByText('Credit Card Payoff')).toBeInTheDocument();
  });

  it('triggers confetti for completed goals', () => {
    const { triggerConfetti } = require('@/lib/utils/confetti');

    render(<GoalNotifications goals={[mockGoals[0]]} onDismiss={mockOnDismiss} />);

    expect(triggerConfetti).toHaveBeenCalledWith({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });
  });

  it('triggers smaller confetti for milestones', () => {
    const { triggerConfetti } = require('@/lib/utils/confetti');

    render(<GoalNotifications goals={[mockGoals[2]]} onDismiss={mockOnDismiss} />);

    expect(triggerConfetti).toHaveBeenCalledWith({
      particleCount: 50,
      spread: 50,
      origin: { y: 0.6 },
    });
  });

  it('sends email notifications for completed goals', async () => {
    render(<GoalNotifications goals={[mockGoals[0]]} onDismiss={mockOnDismiss} />);

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/notifications/email',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('"type":"goal_completed"'),
      })
    );
  });

  it('sends email notifications for milestones', async () => {
    render(<GoalNotifications goals={[mockGoals[2]]} onDismiss={mockOnDismiss} />);

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/notifications/email',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('"type":"milestone_reached"'),
      })
    );
  });

  it('renders notifications in a virtualized list', () => {
    render(<GoalNotifications goals={mockGoals} onDismiss={mockOnDismiss} />);

    const container = screen.getByText('🎉 Goal Completed!').closest('div');
    expect(container?.parentElement).toHaveStyle({
      height: '400px',
      overflow: 'auto',
    });
  });

  it('maintains proper ARIA labels for accessibility', () => {
    render(<GoalNotifications goals={mockGoals} onDismiss={mockOnDismiss} />);

    mockGoals.forEach(goal => {
      expect(screen.getByLabelText(`Dismiss ${goal.name} notification`)).toBeInTheDocument();
    });
  });

  it('handles rapid state updates efficiently', () => {
    const { rerender } = render(<GoalNotifications goals={mockGoals} onDismiss={mockOnDismiss} />);

    // Simulate rapid state updates
    act(() => {
      rerender(
        <GoalNotifications
          goals={[...mockGoals, { ...mockGoals[0], id: '4' }]}
          onDismiss={mockOnDismiss}
        />
      );
      rerender(
        <GoalNotifications
          goals={[...mockGoals, { ...mockGoals[0], id: '5' }]}
          onDismiss={mockOnDismiss}
        />
      );
    });

    // Component should still render correctly
    expect(screen.getByText('🎉 Goal Completed!')).toBeInTheDocument();
  });
});
