import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { AlertSettings } from './AlertSettings.tsx';
import { defaultAlertConfig } from '@/lib/utils/performance-alerts';

const meta: Meta<typeof AlertSettings> = {
  title: 'Dev/AlertSettings',
  component: AlertSettings,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof AlertSettings>;

export const Default: Story = {
  args: {
    initialConfig: defaultAlertConfig,
    onConfigChange: config => console.log('Config changed:', config),
  },
};

export const CustomThresholds: Story = {
  args: {
    initialConfig: {
      renderTime: { warning: 50, error: 100 },
      updateTime: { warning: 30, error: 60 },
      frameTime: { warning: 16, error: 33 },
      memoryUsage: { warning: 50, error: 80 },
      apiResponseTime: { warning: 200, error: 500 },
    },
    onConfigChange: config => console.log('Config changed:', config),
  },
};

export const Disabled: Story = {
  args: {
    initialConfig: defaultAlertConfig,
    onConfigChange: config => console.log('Config changed:', config),
  },
  render: args => (
    <div className="w-[800px]">
      <AlertSettings {...args} />
    </div>
  ),
};

export const DarkMode: Story = {
  args: {
    initialConfig: defaultAlertConfig,
    onConfigChange: config => console.log('Config changed:', config),
  },
  parameters: {
    themes: {
      defaultTheme: 'dark',
    },
  },
};
