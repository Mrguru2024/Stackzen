import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
// import GoalNotifications from './GoalNotifications'; // Unused
import { CategoryGoal } from '@/lib/types/wellness';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SessionProvider } from 'next-auth/react';
// import WellnessDashboard from '../wellness-dashboard/WellnessDashboard.tsx';
const WellnessDashboard = () => <div>Mock WellnessDashboard</div>;
import { SessionProvider } from '@/components/providers/session-provider';

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
        name: 'Test User',
      },
    },
    status: 'authenticated',
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

// Mock API responses
const mockWellnessData = {
  currentScore: {
    id: '1',
    userId: 'user1',
    totalScore: 85,
    status: 'good',
    color: 'green',
    description: "You're doing great!",
    categoryScores: [
      { category: 'savings', score: 90 },
      { category: 'investments', score: 85 },
      { category: 'debt', score: 80 },
    ],
  },
  historicalScores: [
    { date: '2024-01-01', score: 75 },
    { date: '2024-02-01', score: 80 },
    { date: '2024-03-01', score: 85 },
  ],
};

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

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <QueryClientProvider client={queryClient}>
      <SessionProvider session={null}>{ui}</SessionProvider>
    </QueryClientProvider>
  );
};

describe('GoalNotifications Integration', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    // Mock fetch for API calls
    global.fetch = jest.fn().mockImplementation(url => {
      if (url.includes('/api/wellness/score')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockWellnessData),
        });
      }
      if (url.includes('/api/wellness/goals')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockGoals),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      });
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('integrates with wellness dashboard and displays notifications', async () => {
    renderWithProviders(<WellnessDashboard />);

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Emergency Fund')).toBeInTheDocument();
    });

    // Verify notifications are displayed
    expect(screen.getByText('🎉 Goal Completed!')).toBeInTheDocument();
    expect(screen.getByText('🎯 Milestone Achieved!')).toBeInTheDocument();
  });

  it('handles goal updates through the dashboard', async () => {
    renderWithProviders(<WellnessDashboard />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Emergency Fund')).toBeInTheDocument();
    });

    // Simulate goal update
    const updatedGoals = [...mockGoals];
    updatedGoals[0].current = 12000;

    // Mock the update API call
    global.fetch = jest.fn().mockImplementation(url => {
      if (url.includes('/api/wellness/goals')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(updatedGoals),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      });
    });

    // Trigger a refetch
    await act(async () => {
      await queryClient.invalidateQueries({ queryKey: ['wellnessGoals'] });
    });

    // Verify updated notification
    await waitFor(() => {
      expect(screen.getByText('$12,000 / $10,000')).toBeInTheDocument();
    });
  });

  it('handles goal deletion through the dashboard', async () => {
    renderWithProviders(<WellnessDashboard />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Emergency Fund')).toBeInTheDocument();
    });

    // Find and click delete button
    const deleteButton = screen.getByLabelText('Delete Emergency Fund goal');
    fireEvent.click(deleteButton);

    // Mock the delete API call
    global.fetch = jest.fn().mockImplementation(url => {
      if (url.includes('/api/wellness/goals')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockGoals.slice(1)),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      });
    });

    // Verify goal is removed
    await waitFor(() => {
      expect(screen.queryByText('Emergency Fund')).not.toBeInTheDocument();
    });
  });

  it('handles multiple concurrent updates', async () => {
    renderWithProviders(<WellnessDashboard />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Emergency Fund')).toBeInTheDocument();
    });

    // Simulate multiple concurrent updates
    const updates = [
      { ...mockGoals[0], current: 12000 },
      { ...mockGoals[1], current: 30000 },
      { ...mockGoals[2], current: 6000 },
    ];

    // Mock the update API call
    global.fetch = jest.fn().mockImplementation(url => {
      if (url.includes('/api/wellness/goals')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(updates),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      });
    });

    // Trigger multiple refetches
    await act(async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['wellnessGoals'] }),
        queryClient.invalidateQueries({ queryKey: ['wellnessScore'] }),
      ]);
    });

    // Verify all updates are reflected
    await waitFor(() => {
      expect(screen.getByText('$12,000 / $10,000')).toBeInTheDocument();
      expect(screen.getByText('$30,000 / $50,000')).toBeInTheDocument();
      expect(screen.getByText('$6,000 / $8,000')).toBeInTheDocument();
    });
  });

  it('handles error states gracefully', async () => {
    // Mock API error
    global.fetch = jest.fn().mockImplementation(() => {
      return Promise.reject(new Error('API Error'));
    });

    renderWithProviders(<WellnessDashboard />);

    // Verify error state is handled
    await waitFor(() => {
      expect(screen.getByText('Error loading wellness data')).toBeInTheDocument();
    });
  });

  it('maintains state consistency during rapid updates', async () => {
    renderWithProviders(<WellnessDashboard />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Emergency Fund')).toBeInTheDocument();
    });

    // Simulate rapid state updates
    const updates = Array.from({ length: 5 }, (_, i) => ({
      ...mockGoals[0],
      id: `update-${i}`,
      current: 10000 + i * 1000,
    }));

    // Mock the update API call
    global.fetch = jest.fn().mockImplementation(url => {
      if (url.includes('/api/wellness/goals')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(updates),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      });
    });

    // Trigger rapid refetches
    await act(async () => {
      await Promise.all(
        updates.map(() => queryClient.invalidateQueries({ queryKey: ['wellnessGoals'] }))
      );
    });

    // Verify state remains consistent
    await waitFor(() => {
      expect(screen.getByText('$14,000 / $10,000')).toBeInTheDocument();
    });
  });
});
