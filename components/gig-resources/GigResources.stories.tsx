import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import GigResources from './index.tsx';

const meta: Meta<typeof GigResources> = {
  title: 'Core/GigResources',
  component: GigResources,
};
export default meta;

type Story = StoryObj<typeof GigResources>;

export const Default: Story = {
  render: () => <GigResources />,
};
