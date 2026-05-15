import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { AnomalyTrends } from './AnomalyTrends.tsx';

const meta: Meta<typeof AnomalyTrends> = {
  title: 'Dev/AnomalyTrends',
  component: AnomalyTrends,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof AnomalyTrends>;

const generateMockAnomalies = (count: number) => {
  const anomalies = [];
  const now = Date.now();
  const hourMs = 60 * 60 * 1000;
  const metrics = ['renderTime', 'updateTime', 'frameTime', 'memoryUsage'];
  const types = ['spike', 'drop', 'trend'] as const;
  const severities = ['warning', 'error'] as const;

  for (let i = 0; i < count; i++) {
    const timestamp = new Date(now - (count - i) * hourMs);
    const metric = metrics[Math.floor(Math.random() * metrics.length)];
    const type = types[Math.floor(Math.random() * types.length)];
    const severity = severities[Math.floor(Math.random() * severities.length)];
    const value = Math.random() * 1000;
    const threshold = value * 0.8;

    anomalies.push({
      type,
      metric,
      value,
      threshold,
      timestamp,
      severity,
      description: `${metric} ${
        type === 'spike' ? 'spiked' : type === 'drop' ? 'dropped' : 'trended'
      } to ${value.toFixed(2)}`,
    });
  }

  return anomalies;
};

export const Default: Story = {
  args: {
    anomalies: generateMockAnomalies(50),
    timeWindow: '24h',
  },
};

export const ShortTimeWindow: Story = {
  args: {
    anomalies: generateMockAnomalies(10),
    timeWindow: '1h',
  },
};

export const LongTimeWindow: Story = {
  args: {
    anomalies: generateMockAnomalies(168),
    timeWindow: '7d',
  },
};

export const ManyAnomalies: Story = {
  args: {
    anomalies: generateMockAnomalies(200),
    timeWindow: '24h',
  },
};

export const DarkMode: Story = {
  args: {
    anomalies: generateMockAnomalies(50),
    timeWindow: '24h',
  },
  parameters: {
    themes: {
      defaultTheme: 'dark',
    },
  },
};
