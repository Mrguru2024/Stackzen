import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import Guardrails from './index.tsx';

const meta: Meta<typeof Guardrails> = {
  title: 'Core/Guardrails',
  component: Guardrails,
};
export default meta;

type Story = StoryObj<typeof Guardrails>;

export const Default: Story = {
  render: () => <Guardrails />,
};
