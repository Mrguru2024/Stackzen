import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ThemeProvider } from '@/components/theme-provider';

const meta: Meta<typeof ThemeToggle> = {
  title: 'UI/ThemeToggle',
  component: ThemeToggle,
  tags: ['autodocs'],
  decorators: [
    Story => (
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <div className="p-4">
          <Story />
        </div>
      </ThemeProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ThemeToggle>;

export const Default: Story = {
  render: () => <ThemeToggle />,
};

export const WithCustomSize: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <ThemeToggle />
      <span className="text-sm text-muted-foreground">Click to change theme</span>
    </div>
  ),
};

export const InNavbar: Story = {
  render: () => (
    <div className="flex items-center justify-between border-b p-4">
      <div className="font-semibold">App Name</div>
      <ThemeToggle />
    </div>
  ),
};
