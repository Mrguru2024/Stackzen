import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { ThemeToggle } from './index';

const meta: Meta<typeof ThemeToggle> = {
  title: 'Components/ThemeToggle',
  component: ThemeToggle,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    Story => (
      <div className="p-4">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const InLightTheme: Story = {
  decorators: [
    Story => (
      <div className="bg-white p-4">
        <Story />
      </div>
    ),
  ],
};

export const InDarkTheme: Story = {
  decorators: [
    Story => (
      <div className="bg-gray-900 p-4">
        <Story />
      </div>
    ),
  ],
};
