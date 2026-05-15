import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { PerformanceAnomalies } from './PerformanceAnomalies.tsx';

const meta: Meta<typeof PerformanceAnomalies> = {
  title: 'Dev/PerformanceAnomalies',
  component: PerformanceAnomalies,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof PerformanceAnomalies>;

const generateMockMetrics = (count: number, includeAnomalies = true) => {
  const metrics = [];
  const now = Date.now();
  const hourMs = 60 * 60 * 1000;

  for (let i = 0; i < count; i++) {
    const timestamp = new Date(now - (count - i) * hourMs);

    // Generate normal metrics
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

    // Add anomalies if requested
    if (includeAnomalies && i % 5 === 0) {
      metrics.push(
        {
          componentName: 'TestComponent',
          metricName: 'renderTime',
          value: 150 + Math.random() * 50, // Spike
          timestamp,
        },
        {
          componentName: 'TestComponent',
          metricName: 'memoryUsage',
          value: 500 * 1024 * 1024 + Math.random() * 100 * 1024 * 1024, // Spike
          timestamp,
        }
      );
    }
  }

  return metrics;
};

export const Default: Story = {
  args: {
    metrics: generateMockMetrics(24),
    timeWindow: '24h',
  },
};

export const NoAnomalies: Story = {
  args: {
    metrics: generateMockMetrics(24, false),
    timeWindow: '24h',
  },
};

export const ShortTimeWindow: Story = {
  args: {
    metrics: generateMockMetrics(1),
    timeWindow: '1h',
  },
};

export const LongTimeWindow: Story = {
  args: {
    metrics: generateMockMetrics(168), // 7 days
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
