import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import SavingsGoalTracker from './index.tsx';

const queryClient = new QueryClient();

const meta: Meta<typeof SavingsGoalTracker> = {
  title: 'Core/SavingsGoalTracker',
  component: SavingsGoalTracker,
  decorators: [
    Story => (
      <QueryClientProvider client={queryClient}>
        <Story />
      </QueryClientProvider>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof SavingsGoalTracker>;

export const Default: Story = {
  render: () => <SavingsGoalTracker />,
};

export const Loading: Story = {
  render: () => <SavingsGoalTracker />,
  parameters: {
    mockData: [
      {
        url: '/api/savings-goals',
        method: 'GET',
        status: 200,
        delay: 2000,
        response: [],
      },
    ],
  },
};

export const Error: Story = {
  render: () => <SavingsGoalTracker />,
  parameters: {
    mockData: [
      {
        url: '/api/savings-goals',
        method: 'GET',
        status: 500,
        response: { error: 'Failed to fetch savings goals' },
      },
    ],
  },
};

export const WithData: Story = {
  render: () => <SavingsGoalTracker />,
  parameters: {
    mockData: [
      {
        url: '/api/savings-goals',
        method: 'GET',
        status: 200,
        response: [
          { id: '1', name: 'Vacation', targetAmount: 1000, currentAmount: 500, userId: 'user-1' },
          { id: '2', name: 'New Car', targetAmount: 20000, currentAmount: 0, userId: 'user-1' },
        ],
      },
    ],
  },
};
