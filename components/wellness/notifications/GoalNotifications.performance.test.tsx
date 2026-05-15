import React from 'react';
import { render, act } from '@testing-library/react';
import GoalNotifications from './GoalNotifications.tsx';
import { _CategoryGoal } from '@/lib/types/wellness';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SessionProvider } from 'next-auth/react';
import { performance } from 'perf_hooks';
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

function generateMockGoals(count) {
  return Array.from({ length: count }, (_, i) => ({
    id: `goal-${i}`,
    name: `Goal ${i}`,
    progress: Math.floor(Math.random() * 100),
    completed: false,
    deadline: new Date().toISOString(),
  }));
}

describe('GoalNotifications Performance', () => {
  let queryClient: QueryClient;
  const performanceThresholds = {
    initialRender: 100, // ms
    updateRender: 50, // ms
    memoryUsage: 50 * 1024 * 1024, // 50MB
    frameTime: 16.67, // ms (60fps)
  };

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const renderWithProviders = (ui: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <SessionProvider session={null}>{ui}</SessionProvider>
      </QueryClientProvider>
    );
  };

  it('meets initial render performance threshold', () => {
    const goals = generateMockGoals(10);
    const startTime = performance.now();

    renderWithProviders(<GoalNotifications goals={goals} onDismiss={() => {}} />);

    const endTime = performance.now();
    const renderTime = endTime - startTime;

    expect(renderTime).toBeLessThan(performanceThresholds.initialRender);
  });

  it('maintains performance with large datasets', () => {
    const goals = generateMockGoals(100);
    const startTime = performance.now();

    renderWithProviders(<GoalNotifications goals={goals} onDismiss={() => {}} />);

    const endTime = performance.now();
    const renderTime = endTime - startTime;

    expect(renderTime).toBeLessThan(performanceThresholds.initialRender * 2);
  });

  it('handles rapid updates efficiently', async () => {
    const goals = generateMockGoals(10);
    const { rerender } = renderWithProviders(
      <GoalNotifications goals={goals} onDismiss={() => {}} />
    );

    const updateTimes: number[] = [];

    // Simulate 10 rapid updates
    for (let i = 0; i < 10; i++) {
      const startTime = performance.now();
      await act(async () => {
        rerender(
          <GoalNotifications
            goals={goals.map(goal => ({
              ...goal,
              current: goal.current + 1000,
            }))}
            onDismiss={() => {}}
          />
        );
      });
      const endTime = performance.now();
      updateTimes.push(endTime - startTime);
    }

    const averageUpdateTime =
      updateTimes.reduce((sum, time) => sum + time, 0) / updateTimes.length;
    expect(averageUpdateTime).toBeLessThan(performanceThresholds.updateRender);
  });

  it('maintains smooth animations', async () => {
    const goals = generateMockGoals(10);
    const { rerender } = renderWithProviders(
      <GoalNotifications goals={goals} onDismiss={() => {}} />
    );

    const frameTimes: number[] = [];
    let lastFrameTime = performance.now();

    // Simulate 60 frames of animation
    for (let i = 0; i < 60; i++) {
      await act(async () => {
        rerender(
          <GoalNotifications
            goals={goals.map(goal => ({
              ...goal,
              current: goal.current + 100,
            }))}
            onDismiss={() => {}}
          />
        );
      });

      const currentTime = performance.now();
      const frameTime = currentTime - lastFrameTime;
      frameTimes.push(frameTime);
      lastFrameTime = currentTime;
    }

    const averageFrameTime = frameTimes.reduce((sum, time) => sum + time, 0) / frameTimes.length;
    expect(averageFrameTime).toBeLessThan(performanceThresholds.frameTime);
  });

  it('optimizes memory usage', () => {
    const goals = generateMockGoals(1000);
    const startMemory = process.memoryUsage().heapUsed;

    renderWithProviders(<GoalNotifications goals={goals} onDismiss={() => {}} />);

    const endMemory = process.memoryUsage().heapUsed;
    const memoryUsed = endMemory - startMemory;

    expect(memoryUsed).toBeLessThan(performanceThresholds.memoryUsage);
  });

  it('maintains performance during virtual scrolling', async () => {
    const goals = generateMockGoals(100);
    const { container } = renderWithProviders(
      <GoalNotifications goals={goals} onDismiss={() => {}} />
    );

    const scrollContainer = container.querySelector('[data-testid="notifications-container"]');
    if (!scrollContainer) throw new Error('Scroll container not found');

    const scrollTimes: number[] = [];

    // Simulate rapid scrolling
    for (let i = 0; i < 10; i++) {
      const startTime = performance.now();
      await act(async () => {
        scrollContainer.scrollTop = i * 1000;
      });
      const endTime = performance.now();
      scrollTimes.push(endTime - startTime);
    }

    const averageScrollTime =
      scrollTimes.reduce((sum, time) => sum + time, 0) / scrollTimes.length;
    expect(averageScrollTime).toBeLessThan(performanceThresholds.frameTime * 2);
  });

  it('handles concurrent operations efficiently', async () => {
    const goals = generateMockGoals(50);
    const { rerender } = renderWithProviders(
      <GoalNotifications goals={goals} onDismiss={() => {}} />
    );

    const startTime = performance.now();

    // Simulate concurrent operations
    await Promise.all([
      act(async () => {
        rerender(
          <GoalNotifications
            goals={goals.map(goal => ({
              ...goal,
              current: goal.current + 1000,
            }))}
            onDismiss={() => {}}
          />
        );
      }),
      act(async () => {
        rerender(
          <GoalNotifications
            goals={goals.map(goal => ({
              ...goal,
              current: goal.current + 2000,
            }))}
            onDismiss={() => {}}
          />
        );
      }),
    ]);

    const endTime = performance.now();
    const operationTime = endTime - startTime;

    expect(operationTime).toBeLessThan(performanceThresholds.updateRender * 2);
  });

  it('maintains performance with frequent state updates', async () => {
    const goals = generateMockGoals(20);
    const { rerender } = renderWithProviders(
      <GoalNotifications goals={goals} onDismiss={() => {}} />
    );

    const updateTimes: number[] = [];

    // Simulate frequent state updates
    for (let i = 0; i < 50; i++) {
      const startTime = performance.now();
      await act(async () => {
        rerender(
          <GoalNotifications
            goals={goals.map(goal => ({
              ...goal,
              current: goal.current + Math.random() * 1000,
            }))}
            onDismiss={() => {}}
          />
        );
      });
      const endTime = performance.now();
      updateTimes.push(endTime - startTime);
    }

    const averageUpdateTime =
      updateTimes.reduce((sum, time) => sum + time, 0) / updateTimes.length;
    expect(averageUpdateTime).toBeLessThan(performanceThresholds.updateRender);
  });
});
