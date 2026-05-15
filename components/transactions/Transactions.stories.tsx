import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import Transactions from './index.tsx';

const meta: Meta<typeof Transactions> = {
  title: 'Core/Transactions',
  component: Transactions,
};
export default meta;

type Story = StoryObj<typeof Transactions>;

export const Default: Story = {
  render: () => <Transactions />,
};
