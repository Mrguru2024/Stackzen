import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import Affiliates from './index.tsx';

const meta: Meta<typeof Affiliates> = {
  title: 'Core/Affiliates',
  component: Affiliates,
};
export default meta;

type Story = StoryObj<typeof Affiliates>;

export const Default: Story = {
  render: () => <Affiliates />,
};
