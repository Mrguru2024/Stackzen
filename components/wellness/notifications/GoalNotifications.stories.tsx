import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Meta, StoryObj } from '@storybook/react';
import { GoalNotifications } from './GoalNotifications.tsx';
import { CategoryGoal } from '@/lib/types/wellness';

const meta = {
  title: 'Wellness/GoalNotifications',
  component: GoalNotifications,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    Story => (
      <div className="w-[400px]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof GoalNotifications>;

export default meta;
type Story = StoryObj<typeof meta>;

// Mock goals for different scenarios
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
  {
    id: '4',
    category: 'savings',
    name: 'Vacation Fund',
    target: 5000,
    current: 1250,
    deadline: new Date('2024-08-31').toISOString(),
    completed: false,
  },
];

// Mock session for email notifications
const mockSession = {
  data: {
    user: {
      email: 'test@example.com',
    },
  },
};

// Mock next-auth
jest.mock('next-auth/react', () => ({
  useSession: () => mockSession,
}));

export const CompletedGoal: Story = {
  args: {
    goals: [mockGoals[0]],
    onDismiss: (id: string) => console.log('Dismissed goal:', id),
  },
};

export const MilestoneAchieved: Story = {
  args: {
    goals: [mockGoals[2]],
    onDismiss: (id: string) => console.log('Dismissed goal:', id),
  },
};

export const DeadlineApproaching: Story = {
  args: {
    goals: [mockGoals[1]],
    onDismiss: (id: string) => console.log('Dismissed goal:', id),
  },
};

export const MultipleNotifications: Story = {
  args: {
    goals: mockGoals,
    onDismiss: (id: string) => console.log('Dismissed goal:', id),
  },
};

export const EmptyState: Story = {
  args: {
    goals: [],
    onDismiss: (id: string) => console.log('Dismissed goal:', id),
  },
};

export const CustomClassName: Story = {
  args: {
    goals: [mockGoals[0]],
    onDismiss: (id: string) => console.log('Dismissed goal:', id),
    className: 'bg-gray-50 dark:bg-gray-900 p-4 rounded-lg',
  },
};

export const QuarterMilestone: Story = {
  args: {
    goals: [mockGoals[3]],
    onDismiss: (id: string) => console.log('Dismissed goal:', id),
  },
};

export const DarkMode: Story = {
  args: {
    goals: mockGoals,
    onDismiss: (id: string) => console.log('Dismissed goal:', id),
  },
  parameters: {
    themes: {
      defaultTheme: 'dark',
    },
  },
};
