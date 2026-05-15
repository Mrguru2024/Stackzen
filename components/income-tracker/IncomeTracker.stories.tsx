import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import IncomeTracker from './index.tsx';

const queryClient = new QueryClient();

const meta: Meta<typeof IncomeTracker> = {
  title: 'Core/IncomeTracker',
  component: IncomeTracker,
  decorators: [
    Story => (
      <QueryClientProvider client={queryClient}>
        <Story />
      </QueryClientProvider>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof IncomeTracker>;

export const Default: Story = {
  render: () => <IncomeTracker />,
};

export const Loading: Story = {
  render: () => <IncomeTracker />,
  parameters: {
    mockData: [
      {
        url: '/api/income',
        method: 'GET',
        status: 200,
        delay: 2000,
        response: [],
      },
    ],
  },
};

export const Error: Story = {
  render: () => <IncomeTracker />,
  parameters: {
    mockData: [
      {
        url: '/api/income',
        method: 'GET',
        status: 500,
        response: { error: 'Failed to fetch incomes' },
      },
    ],
  },
};

export const WithData: Story = {
  render: () => <IncomeTracker />,
  parameters: {
    mockData: [
      {
        url: '/api/income',
        method: 'GET',
        status: 200,
        response: [
          { id: '1', amount: 100, description: 'Salary', date: '2023-01-01', userId: 'user-1' },
          { id: '2', amount: 200, description: 'Bonus', date: '2023-01-02', userId: 'user-1' },
        ],
      },
    ],
  },
};
