import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import FinancialDashboard from './index.tsx';

const meta: Meta<typeof FinancialDashboard> = {
  title: 'Core/FinancialDashboard',
  component: FinancialDashboard,
};
export default meta;

type Story = StoryObj<typeof FinancialDashboard>;

export const Default: Story = {
  render: () => <FinancialDashboard />,
};
