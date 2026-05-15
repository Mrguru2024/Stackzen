import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import Mentorship from './index.tsx';

const meta: Meta<typeof Mentorship> = {
  title: 'Core/Mentorship',
  component: Mentorship,
};
export default meta;

type Story = StoryObj<typeof Mentorship>;

export const Default: Story = {
  render: () => <Mentorship />,
};
