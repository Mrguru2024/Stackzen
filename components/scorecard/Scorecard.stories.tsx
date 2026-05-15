import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import Scorecard from './index.tsx';

const meta: Meta<typeof Scorecard> = {
  title: 'Core/Scorecard',
  component: Scorecard,
};
export default meta;

type Story = StoryObj<typeof Scorecard>;

export const Default: Story = {
  render: () => <Scorecard />,
};
