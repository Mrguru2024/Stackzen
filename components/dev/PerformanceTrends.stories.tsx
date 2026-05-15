import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { PerformanceTrends } from './PerformanceTrends.tsx';

const meta: Meta<typeof PerformanceTrends> = {
  title: 'Dev/PerformanceTrends',
  component: PerformanceTrends,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof PerformanceTrends>;

const generateMockMetrics = (hours: number) => {
  const metrics = [];
  const now = Date.now();
  const hourMs = 60 * 60 * 1000;

  for (let i = 0; i < hours; i++) {
    const timestamp = new Date(now - (hours - i) * hourMs);
    metrics.push(
      {
        componentName: 'TestComponent',
        metricName: 'renderTime',
        value: 50 + Math.random() * 20,
        timestamp,
      },
      {
        componentName: 'TestComponent',
        metricName: 'updateTime',
        value: 30 + Math.random() * 15,
        timestamp,
      },
      {
        componentName: 'TestComponent',
        metricName: 'frameTime',
        value: 16 + Math.random() * 5,
        timestamp,
      },
      {
        componentName: 'TestComponent',
        metricName: 'memoryUsage',
        value: 100 * 1024 * 1024 + Math.random() * 50 * 1024 * 1024,
        timestamp,
      }
    );
  }

  return metrics;
};

export const LastHour: Story = {
  args: {
    metrics: generateMockMetrics(1),
    timeWindow: '1h',
  },
};

export const LastSixHours: Story = {
  args: {
    metrics: generateMockMetrics(6),
    timeWindow: '6h',
  },
};

export const LastDay: Story = {
  args: {
    metrics: generateMockMetrics(24),
    timeWindow: '24h',
  },
};

export const LastWeek: Story = {
  args: {
    metrics: generateMockMetrics(24 * 7),
    timeWindow: '7d',
  },
};

export const DarkMode: Story = {
  args: {
    metrics: generateMockMetrics(24),
    timeWindow: '24h',
  },
  parameters: {
    themes: {
      defaultTheme: 'dark',
    },
  },
};
