import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import StackZenGigsManager from './index.tsx';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const meta: Meta<typeof StackZenGigsManager> = {
  title: 'Admin/StackZenGigsManager',
  component: StackZenGigsManager,
};
export default meta;

type Story = StoryObj<typeof StackZenGigsManager>;

const queryClient = new QueryClient();

export const Default: Story = {
  render: () => (
    <QueryClientProvider client={queryClient}>
      <StackZenGigsManager />
    </QueryClientProvider>
  ),
};
