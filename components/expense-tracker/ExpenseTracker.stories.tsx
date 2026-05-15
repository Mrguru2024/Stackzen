import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ExpenseTracker from './index.tsx';

const queryClient = new QueryClient();

const meta: Meta<typeof ExpenseTracker> = {
  title: 'Core/ExpenseTracker',
  component: ExpenseTracker,
  decorators: [
    Story => (
      <QueryClientProvider client={queryClient}>
        <Story />
      </QueryClientProvider>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof ExpenseTracker>;

export const Default: Story = {
  render: () => <ExpenseTracker />,
};

export const Loading: Story = {
  render: () => <ExpenseTracker />,
  parameters: {
    mockData: [
      {
        url: '/api/expenses',
        method: 'GET',
        status: 200,
        delay: 2000,
        response: [],
      },
    ],
  },
};

export const Error: Story = {
  render: () => <ExpenseTracker />,
  parameters: {
    mockData: [
      {
        url: '/api/expenses',
        method: 'GET',
        status: 500,
        response: { error: 'Failed to fetch expenses' },
      },
    ],
  },
};

export const WithData: Story = {
  render: () => <ExpenseTracker />,
  parameters: {
    mockData: [
      {
        url: '/api/expenses',
        method: 'GET',
        status: 200,
        response: [
          { id: '1', amount: 100, description: 'Groceries', date: '2023-01-01', userId: 'user-1' },
          { id: '2', amount: 200, description: 'Rent', date: '2023-01-02', userId: 'user-1' },
        ],
      },
    ],
  },
};
