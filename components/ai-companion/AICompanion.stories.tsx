import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import AICompanion from './index.tsx';

const meta: Meta<typeof AICompanion> = {
  title: 'Core/AICompanion',
  component: AICompanion,
};
export default meta;

type Story = StoryObj<typeof AICompanion>;

export const Default: Story = {
  render: () => <AICompanion />,
};
