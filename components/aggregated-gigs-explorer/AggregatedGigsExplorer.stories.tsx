import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import AggregatedGigsExplorer from './index.tsx';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const meta: Meta<typeof AggregatedGigsExplorer> = {
  title: 'Gigs/AggregatedGigsExplorer',
  component: AggregatedGigsExplorer,
};
export default meta;

type Story = StoryObj<typeof AggregatedGigsExplorer>;

const queryClient = new QueryClient();

export const Default: Story = {
  render: () => (
    <QueryClientProvider client={queryClient}>
      <AggregatedGigsExplorer />
    </QueryClientProvider>
  ),
};
