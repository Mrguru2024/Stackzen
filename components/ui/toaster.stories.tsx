import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Toaster } from './toaster';
import { Toaster } from './toaster.tsx';

const meta: Meta<typeof Toaster> = {
  title: 'UI/Toaster',
  component: Toaster,
};
export default meta;

type Story = StoryObj<typeof Toaster>;

export const Default: Story = {
  render: () => <Toaster />,
};
