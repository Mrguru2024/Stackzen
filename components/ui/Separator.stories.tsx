import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Separator } from '../separator';

const meta: Meta<typeof Separator> = {
  title: 'UI/Separator',
  component: Separator,
  tags: ['autodocs'],
  argTypes: {
    orientation: {
      control: 'select',
      options: ['horizontal', 'vertical'],
      description: 'The orientation of the separator',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes to apply',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Separator>;

export const Default: Story = {
  args: {
    orientation: 'horizontal',
  },
};

export const Vertical: Story = {
  args: {
    orientation: 'vertical',
  },
  decorators: [
    Story => (
      <div className="flex h-32 items-center">
        <Story />
      </div>
    ),
  ],
};

export const CustomStyling: Story = {
  args: {
    className: 'bg-blue-500 dark:bg-blue-400',
  },
};

export const WithContent: Story = {
  render: () => (
    <div className="space-y-4">
      <div>Content above</div>
      <Separator />
      <div>Content below</div>
    </div>
  ),
};
