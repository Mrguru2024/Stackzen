import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Check } from 'lucide-react';

const meta: Meta<typeof Check> = {
  title: 'UI/Icons',
  component: Check,
};
export default meta;

type Story = StoryObj<typeof Check>;

export const CheckIcon: Story = {
  render: () => <Check data-testid="icon-check" />,
};
