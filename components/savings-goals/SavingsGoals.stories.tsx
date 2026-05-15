import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import SavingsGoals from './index.tsx';

const meta: Meta<typeof SavingsGoals> = {
  title: 'Core/SavingsGoals',
  component: SavingsGoals,
};
export default meta;

type Story = StoryObj<typeof SavingsGoals>;

export const Default: Story = {
  render: () => <SavingsGoals />,
};
