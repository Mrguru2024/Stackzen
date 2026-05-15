import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Meta, StoryObj } from '@storybook/react';
import CategoryGoals from './CategoryGoals.tsx';
// import { _WELLNESS_CATEGORIES } from '@/constants/wellness'; // Unused

const meta: Meta<typeof CategoryGoals> = {
  title: 'Wellness/CategoryGoals',
  component: CategoryGoals,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof CategoryGoals>;

const mockScores = [
  {
    id: '1',
    userId: 'user1',
    totalScore: 75,
    status: 'Good',
    color: '#4AE66C',
    description: 'Good financial health',
    timestamp: new Date().toISOString(),
    categoryScores: {
      income: 80,
      savings: 70,
      debt: 75,
      emergency: 65,
      investments: 85,
      goals: 70,
    },
    recommendations: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const mockGoals = [
  {
    id: '1',
    category: 'savings',
    name: 'Emergency Fund',
    target: 10000,
    current: 5000,
    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '2',
    category: 'debt',
    name: 'Credit Card Payoff',
    target: 5000,
    current: 2000,
    deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const mockHandlers = {
  onAddGoal: (goal: any) => console.log('Add goal:', goal),
  onUpdateGoal: (goal: any) => console.log('Update goal:', goal),
  onDeleteGoal: (goalId: string) => console.log('Delete goal:', goalId),
};

export const Default: Story = {
  args: {
    scores: mockScores,
    goals: mockGoals,
    ...mockHandlers,
  },
};

export const EmptyGoals: Story = {
  args: {
    scores: mockScores,
    goals: [],
    ...mockHandlers,
  },
};

export const MultipleGoalsPerCategory: Story = {
  args: {
    scores: mockScores,
    goals: [
      ...mockGoals,
      {
        id: '3',
        category: 'savings',
        name: 'Vacation Fund',
        target: 3000,
        current: 1500,
        deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: '4',
        category: 'investments',
        name: 'Retirement Fund',
        target: 100000,
        current: 25000,
        deadline: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ],
    ...mockHandlers,
  },
};

export const GoalsWithProgress: Story = {
  args: {
    scores: mockScores,
    goals: [
      {
        id: '1',
        category: 'savings',
        name: 'Emergency Fund',
        target: 10000,
        current: 9500,
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: '2',
        category: 'debt',
        name: 'Credit Card Payoff',
        target: 5000,
        current: 5000,
        deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ],
    ...mockHandlers,
  },
};

export const CustomClassName: Story = {
  args: {
    scores: mockScores,
    goals: mockGoals,
    className: 'max-w-2xl',
    ...mockHandlers,
  },
};
