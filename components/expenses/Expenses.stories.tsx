import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import Expenses from './index.tsx';

const meta: Meta<typeof Expenses> = {
  title: 'Expenses/Expenses',
  component: Expenses,
};
export default meta;

type Story = StoryObj<typeof Expenses>;

export const Default: Story = {
  render: () => <Expenses />,
};
