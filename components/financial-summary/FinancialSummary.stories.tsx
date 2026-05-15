import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import FinancialSummary from './index.tsx';

const meta: Meta<typeof FinancialSummary> = {
  title: 'Core/FinancialSummary',
  component: FinancialSummary,
};
export default meta;

type Story = StoryObj<typeof FinancialSummary>;

export const Default: Story = {
  render: () => <FinancialSummary />,
};
