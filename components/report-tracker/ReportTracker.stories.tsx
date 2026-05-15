import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ReportTracker from './index.tsx';

const queryClient = new QueryClient();

const meta: Meta<typeof ReportTracker> = {
  title: 'Core/ReportTracker',
  component: ReportTracker,
  decorators: [
    Story => (
      <QueryClientProvider client={queryClient}>
        <Story />
      </QueryClientProvider>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof ReportTracker>;

export const Default: Story = {
  render: () => <ReportTracker />,
};

export const Loading: Story = {
  render: () => <ReportTracker />,
  parameters: {
    mockData: [
      {
        url: '/api/reports',
        method: 'GET',
        status: 200,
        delay: 2000,
        response: [],
      },
    ],
  },
};

export const Error: Story = {
  render: () => <ReportTracker />,
  parameters: {
    mockData: [
      {
        url: '/api/reports',
        method: 'GET',
        status: 500,
        response: { error: 'Failed to fetch reports' },
      },
    ],
  },
};

export const WithData: Story = {
  render: () => <ReportTracker />,
  parameters: {
    mockData: [
      {
        url: '/api/reports',
        method: 'GET',
        status: 200,
        response: [
          { id: '1', name: 'Monthly Report', date: '2023-01-01', userId: 'user-1' },
          { id: '2', name: 'Quarterly Report', date: '2023-01-02', userId: 'user-1' },
        ],
      },
    ],
  },
};
