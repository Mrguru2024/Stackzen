import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import DashboardLayout from './DashboardLayout.tsx';

const meta: Meta<typeof DashboardLayout> = {
  title: 'Layout/DashboardLayout',
  component: DashboardLayout,
};
export default meta;

type Story = StoryObj<typeof DashboardLayout>;

export const Default: Story = {
  render: () => (
    <DashboardLayout>
      <div className="p-8">
        <h2 className="mb-4 text-2xl font-bold">Dashboard Content</h2>
        <p>This is a sample dashboard page inside the layout.</p>
      </div>
    </DashboardLayout>
  ),
};
