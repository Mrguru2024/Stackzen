import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { LoadingSpinner } from './index';

const meta: Meta<typeof LoadingSpinner> = {
  title: 'UI/LoadingSpinner',
  component: LoadingSpinner,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'default', 'lg', 'xl'],
    },
    variant: {
      control: 'select',
      options: ['default', 'secondary', 'muted', 'white'],
    },
    fullScreen: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof LoadingSpinner>;

export const Default: Story = {
  args: {
    size: 'default',
    variant: 'default',
  },
};

export const Small: Story = {
  args: {
    size: 'sm',
  },
};

export const Large: Story = {
  args: {
    size: 'lg',
  },
};

export const ExtraLarge: Story = {
  args: {
    size: 'xl',
  },
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
  },
};

export const Muted: Story = {
  args: {
    variant: 'muted',
  },
};

export const White: Story = {
  args: {
    variant: 'white',
  },
  parameters: {
    backgrounds: { default: 'dark' },
  },
};

export const FullScreen: Story = {
  args: {
    fullScreen: true,
  },
  parameters: {
    layout: 'fullscreen',
  },
};
