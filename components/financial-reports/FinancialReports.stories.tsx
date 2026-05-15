import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import FinancialReports from './index.tsx';

const meta: Meta<typeof FinancialReports> = {
  title: 'Core/FinancialReports',
  component: FinancialReports,
};
export default meta;

type Story = StoryObj<typeof FinancialReports>;

export const Default: Story = {
  render: () => <FinancialReports />,
};
