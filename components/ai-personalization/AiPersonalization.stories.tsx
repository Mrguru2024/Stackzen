import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import AiPersonalization from './index.tsx';

const meta: Meta<typeof AiPersonalization> = {
  title: 'Core/AiPersonalization',
  component: AiPersonalization,
};
export default meta;

type Story = StoryObj<typeof AiPersonalization>;

export const Default: Story = {
  render: () => <AiPersonalization />,
};
