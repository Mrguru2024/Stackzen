import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import Settings from './index.tsx';

const meta: Meta<typeof Settings> = {
  title: 'Settings/Settings',
  component: Settings,
};
export default meta;

type Story = StoryObj<typeof Settings>;

export const Default: Story = {
  render: () => <Settings />,
};
