'use client';

import React, { useEffect, useState, useCallback, useMemo, useRef, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui';
import Progress from '@/components/ui/progress';
import { formatCurrency } from '@/lib/utils/format';
import { formatDistanceToNow } from 'date-fns';
import { CategoryGoal } from '@/lib/types/wellness';
import { triggerConfetti } from '@/lib/utils/confetti';
import { sendGoalNotification } from '@/lib/utils/notifications';
import { useSession } from 'next-auth/react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { usePerformanceMonitor } from '@/lib/utils/performance';

interface GoalNotificationsProps {
  goals: CategoryGoal[];
  onDismiss: (goalId: string) => void;
  className?: string;
}

const MILESTONE_PERCENTAGES = [25, 50, 75];

// Memoized notification card component
const NotificationCard = memo(function NotificationCard({
  goal,
  type,
  onDismiss,
  milestonePercentage,
}: {
  goal: CategoryGoal;
  type: 'completed' | 'milestone' | 'upcoming';
  onDismiss: (id: string) => void;
  milestonePercentage?: number;
}) {
  const { measureRender } = usePerformanceMonitor('NotificationCard');
  const endRender = measureRender();

  const cardStyles = {
    completed: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
    milestone: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
    upcoming: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
  };

  const textStyles = {
    completed: 'text-green-700 dark:text-green-300',
    milestone: 'text-blue-700 dark:text-blue-300',
    upcoming: 'text-yellow-700 dark:text-yellow-300',
  };

  const buttonStyles = {
    completed: 'text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300',
    milestone: 'text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300',
    upcoming:
      'text-yellow-600 hover:text-yellow-700 dark:text-yellow-400 dark:hover:text-yellow-300',
  };

  useEffect(() => {
    endRender();
  }, []);

  return (
    <Card className={`p-4 ${cardStyles[type]}`}>
      <div className="flex items-start justify-between">
        <div>
          <h4 className={`font-semibold ${textStyles[type]}`}>
            {type === 'completed' && '🎉 Goal Completed!'}
            {type === 'milestone' && '🎯 Milestone Achieved!'}
            {type === 'upcoming' && '⏰ Deadline Approaching'}
          </h4>
          <p className={`text-sm ${textStyles[type].replace('700', '600')} mt-1`}>{goal.name}</p>
          {(type === 'milestone' || type === 'upcoming') && (
            <div className="mt-2">
              <Progress
                value={(goal.current / goal.target) * 100}
                className={`h-2 ${
                  type === 'milestone'
                    ? 'bg-blue-100 dark:bg-blue-900/50'
                    : 'bg-yellow-100 dark:bg-yellow-900/50'
                }`}
              />
              <div
                className={`flex justify-between text-xs ${
                  type === 'milestone'
                    ? 'text-blue-500 dark:text-blue-500'
                    : 'text-yellow-500 dark:text-yellow-500'
                } mt-1`}
              >
                <span>
                  {formatCurrency(goal.current)} / {formatCurrency(goal.target)}
                </span>
                {type === 'milestone' ? (
                  <span>{milestonePercentage}% Complete</span>
                ) : (
                  <span>
                    {formatDistanceToNow(new Date(goal.deadline), {
                      addSuffix: true,
                    })}
                  </span>
                )}
              </div>
            </div>
          )}
          {type === 'completed' && (
            <p className={`text-xs ${textStyles[type].replace('700', '500')} mt-1`}>
              Target: {formatCurrency(goal.target)}
            </p>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className={buttonStyles[type]}
          onClick={() => onDismiss(goal.id)}
          aria-label={`Dismiss ${goal.name} notification`}
        >
          Dismiss
        </Button>
      </div>
    </Card>
  );
});

export const GoalNotifications = memo(function GoalNotifications({
  goals,
  onDismiss,
  className = '',
}: GoalNotificationsProps) {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<{
    completed: CategoryGoal[];
    upcoming: CategoryGoal[];
    milestones: Array<CategoryGoal & { milestonePercentage: number }>;
  }>({ completed: [], upcoming: [], milestones: [] });

  const { measureRender, measureUpdate, measureMemory, measureFrameTime } =
    usePerformanceMonitor('GoalNotifications');
  const endRender = measureRender();
  const frameTimes = useRef<number[]>([]);
  const lastFrameTime = useRef(performance.now());

  // Memoize the parent ref for virtual scrolling
  const parentRef = useRef<HTMLDivElement>(null);

  // Memoize the combined notifications array
  const allNotifications = useMemo(() => {
    return [
      ...notifications.completed.map(goal => ({
        goal,
        type: 'completed' as const,
      })),
      ...notifications.milestones.map(goal => ({
        goal,
        type: 'milestone' as const,
        milestonePercentage: goal.milestonePercentage,
      })),
      ...notifications.upcoming.map(goal => ({
        goal,
        type: 'upcoming' as const,
      })),
    ];
  }, [notifications]);

  // Set up virtual scrolling
  const rowVirtualizer = useVirtualizer({
    count: allNotifications.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 120, // Estimated height of each notification
    overscan: 5, // Number of items to render outside of the visible area
  });

  useEffect(() => {
    endRender();
    measureMemory();
  }, [endRender, measureMemory]);

  useEffect(() => {
    const currentTime = performance.now();
    const frameTime = currentTime - lastFrameTime.current;
    frameTimes.current.push(frameTime);
    lastFrameTime.current = currentTime;

    if (frameTimes.current.length >= 60) {
      measureFrameTime(frameTimes.current);
      frameTimes.current = [];
    }
  });

  const handleDismiss = useCallback(
    (goalId: string) => {
      onDismiss(goalId);
      measureUpdate();
    },
    [onDismiss, measureUpdate]
  );

  useEffect(() => {
    const now = new Date();
    const completed = goals.filter(goal => goal.current >= goal.target && !goal.completed);
    const upcoming = goals.filter(
      goal =>
        goal.current < goal.target &&
        new Date(goal.deadline) > now &&
        new Date(goal.deadline).getTime() - now.getTime() <= 7 * 24 * 60 * 60 * 1000 // 7 days
    );

    // Check for milestones
    const milestones = goals
      .filter(goal => goal.current < goal.target)
      .flatMap(goal => {
        const progress = (goal.current / goal.target) * 100;
        return MILESTONE_PERCENTAGES.filter(
          milestone => progress >= milestone && progress < milestone + 25
        ).map(milestone => ({
          ...goal,
          milestonePercentage: milestone,
        }));
      });

    setNotifications({ completed, upcoming, milestones });

    // Send notifications for completed goals
    if (completed.length > 0 && session?.user?.email) {
      completed.forEach(goal => {
        sendGoalNotification({
          type: 'goal_completed',
          goal,
          userEmail: session.user.email!,
        });
      });
      // Trigger confetti for completed goals
      triggerConfetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    }

    // Send notifications for upcoming deadlines
    if (upcoming.length > 0 && session?.user?.email) {
      upcoming.forEach(goal => {
        sendGoalNotification({
          type: 'deadline_approaching',
          goal,
          userEmail: session.user.email!,
        });
      });
    }

    // Send notifications for milestones
    if (milestones.length > 0 && session?.user?.email) {
      milestones.forEach(goal => {
        sendGoalNotification({
          type: 'milestone_reached',
          goal,
          userEmail: session.user.email!,
          milestone: {
            percentage: goal.milestonePercentage,
            value: goal.current,
          },
        });
      });
      // Trigger a smaller confetti burst for milestones
      triggerConfetti({
        particleCount: 50,
        spread: 50,
        origin: { y: 0.6 },
      });
    }
  }, [goals, session?.user?.email]);

  if (allNotifications.length === 0) {
    return null;
  }

  return (
    <div className={className} ref={parentRef} style={{ height: '400px', overflow: 'auto' }}>
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        <AnimatePresence>
          {rowVirtualizer.getVirtualItems().map(virtualRow => {
            const notification = allNotifications[virtualRow.index];
            return (
              <motion.div
                key={`${notification.type}-${notification.goal.id}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${virtualRow.start}px)`,
                }}
                className="mb-4"
              >
                <NotificationCard
                  goal={notification.goal}
                  type={notification.type}
                  onDismiss={handleDismiss}
                  milestonePercentage={
                    notification.type === 'milestone' ? notification.milestonePercentage : undefined
                  }
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
});
