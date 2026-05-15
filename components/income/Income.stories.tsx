import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import Income from './index.tsx';

const meta: Meta<typeof Income> = {
  title: 'Income/Income',
  component: Income,
};
export default meta;

type Story = StoryObj<typeof Income>;

export const Default: Story = {
  render: () => <Income />,
};
