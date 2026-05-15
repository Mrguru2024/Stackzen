import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import Gigs from './index.tsx';

const meta: Meta<typeof Gigs> = {
  title: 'Gigs/Gigs',
  component: Gigs,
};
export default meta;

type Story = StoryObj<typeof Gigs>;

export const Default: Story = {
  render: () => <Gigs />,
};
