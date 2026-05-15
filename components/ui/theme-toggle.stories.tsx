import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { ThemeToggle } from '@/components/ThemeToggle';

const meta: Meta<typeof ThemeToggle> = {
  title: 'UI/ThemeToggle',
  component: ThemeToggle,
};
export default meta;

type Story = StoryObj<typeof ThemeToggle>;

export const LightMode: Story = {
  render: () => (
    <div className="bg-white p-4">
      <ThemeToggle />
    </div>
  ),
};

export const DarkMode: Story = {
  render: () => (
    <div className="bg-gray-900 p-4">
      <ThemeToggle />
    </div>
  ),
};
