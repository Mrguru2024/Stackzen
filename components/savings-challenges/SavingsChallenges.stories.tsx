import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import SavingsChallenges from './index.tsx';

const meta: Meta<typeof SavingsChallenges> = {
  title: 'Core/SavingsChallenges',
  component: SavingsChallenges,
};
export default meta;

type Story = StoryObj<typeof SavingsChallenges>;

export const Default: Story = {
  render: () => <SavingsChallenges />,
};
