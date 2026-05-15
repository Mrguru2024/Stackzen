import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import Reports from './index.tsx';

const meta: Meta<typeof Reports> = {
  title: 'Core/Reports',
  component: Reports,
};
export default meta;

type Story = StoryObj<typeof Reports>;

export const Default: Story = {
  render: () => <Reports />,
};
