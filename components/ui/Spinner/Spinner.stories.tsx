import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Spinner } from './index';

const meta: Meta<typeof Spinner> = {
  title: 'UI/Spinner',
  component: Spinner,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    size: 'md',
  },
};

export const Small: Story = {
  args: {
    size: 'sm',
  },
};

export const Medium: Story = {
  args: {
    size: 'md',
  },
};

export const Large: Story = {
  args: {
    size: 'lg',
  },
};

export const WithCustomClassName: Story = {
  args: {
    className: 'text-blue-500',
  },
};

export const LoadingStates: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <Spinner size="sm" />
        <span>Loading...</span>
      </div>
      <div className="flex items-center gap-2">
        <Spinner size="md" />
        <span>Processing...</span>
      </div>
      <div className="flex items-center gap-2">
        <Spinner size="lg" />
        <span>Please wait...</span>
      </div>
    </div>
  ),
};
