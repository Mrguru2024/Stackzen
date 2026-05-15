import { CategoryGoal } from '@/lib/types/wellness';
import { formatCurrency } from './format.ts';
import { formatDistanceToNow } from 'date-fns';

interface NotificationOptions {
  type: 'goal_completed' | 'deadline_approaching' | 'milestone_reached';
  goal: CategoryGoal;
  userEmail: string;
  milestone?: {
    percentage: number;
    value: number;
  };
}

export async function sendGoalNotification({
  type,
  goal,
  userEmail,
  milestone,
}: NotificationOptions): Promise<void> {
  const subject =
    type === 'goal_completed'
      ? '🎉 Goal Completed: ' + goal.name
      : type === 'deadline_approaching'
        ? '⏰ Goal Deadline Approaching: ' + goal.name
        : `🎯 ${milestone?.percentage}% Milestone Reached: ${goal.name}`;

  const content =
    type === 'goal_completed'
      ? `
      <h2>Congratulations! 🎉</h2>
      <p>You've successfully completed your financial goal:</p>
      <div style="background-color: #f0fdf4; padding: 1rem; border-radius: 0.5rem; margin: 1rem 0;">
        <h3 style="color: #166534; margin: 0;">${goal.name}</h3>
        <p style="color: #166534; margin: 0.5rem 0;">Target: ${formatCurrency(goal.target)}</p>
        <p style="color: #166534; margin: 0;">Achieved: ${formatCurrency(goal.current)}</p>
      </div>
      <p>Keep up the great work on your financial journey!</p>
    `
      : type === 'deadline_approaching'
        ? `
      <h2>Goal Deadline Approaching ⏰</h2>
      <p>Your financial goal is due soon:</p>
      <div style="background-color: #fefce8; padding: 1rem; border-radius: 0.5rem; margin: 1rem 0;">
        <h3 style="color: #854d0e; margin: 0;">${goal.name}</h3>
        <p style="color: #854d0e; margin: 0.5rem 0;">Target: ${formatCurrency(goal.target)}</p>
        <p style="color: #854d0e; margin: 0.5rem 0;">Current: ${formatCurrency(goal.current)}</p>
        <p style="color: #854d0e; margin: 0;">Due: ${formatDistanceToNow(new Date(goal.deadline), {
          addSuffix: true,
        })}</p>
      </div>
      <p>Don't forget to check your progress and make any necessary adjustments!</p>
    `
        : `
      <h2>Milestone Achieved! 🎯</h2>
      <p>You've reached an important milestone in your financial goal:</p>
      <div style="background-color: #eff6ff; padding: 1rem; border-radius: 0.5rem; margin: 1rem 0;">
        <h3 style="color: #1e40af; margin: 0;">${goal.name}</h3>
        <p style="color: #1e40af; margin: 0.5rem 0;">Milestone: ${milestone?.percentage}%</p>
        <p style="color: #1e40af; margin: 0.5rem 0;">Current: ${formatCurrency(
          milestone?.value || 0
        )}</p>
        <p style="color: #1e40af; margin: 0;">Target: ${formatCurrency(goal.target)}</p>
      </div>
      <p>You're making great progress! Keep going to reach your target.</p>
    `;

  try {
    const response = await fetch('/api/notifications/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: userEmail,
        subject,
        content,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to send notification');
    }
  } catch (error) {
    console.error('Error sending notification:', error);
    // Don't throw the error to prevent disrupting the main flow
  }
}
