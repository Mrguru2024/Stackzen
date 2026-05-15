import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import MembershipTiers from './index.tsx';

const meta: Meta<typeof MembershipTiers> = {
  title: 'Core/MembershipTiers',
  component: MembershipTiers,
};
export default meta;

type Story = StoryObj<typeof MembershipTiers>;

export const Default: Story = {
  render: () => <MembershipTiers />,
};
