import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import FinancialMentorship from './index.tsx';

const meta: Meta<typeof FinancialMentorship> = {
  title: 'Core/FinancialMentorship',
  component: FinancialMentorship,
};
export default meta;

type Story = StoryObj<typeof FinancialMentorship>;

export const Default: Story = {
  render: () => <FinancialMentorship />,
};
