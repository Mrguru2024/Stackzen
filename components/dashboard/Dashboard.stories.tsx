import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Dashboard from './index';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false, refetchOnMount: false } },
});

const meta: Meta<typeof Dashboard> = {
  title: 'Core/Dashboard',
  component: Dashboard,
  decorators: [
    Story => (
      <QueryClientProvider client={queryClient}>
        <Story />
      </QueryClientProvider>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof Dashboard>;

export const Default: Story = {
  render: () => <Dashboard />,
};
