import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import BudgetPlanner from './index.tsx';

const meta: Meta<typeof BudgetPlanner> = {
  title: 'Core/BudgetPlanner',
  component: BudgetPlanner,
};
export default meta;

type Story = StoryObj<typeof BudgetPlanner>;

export const Default: Story = {
  render: () => <BudgetPlanner />,
};
