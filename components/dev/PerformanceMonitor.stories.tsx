import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { PerformanceMonitor } from './PerformanceMonitor.tsx';
import { PerformanceMonitor as Monitor } from '@/lib/utils/performance';

const meta: Meta<typeof PerformanceMonitor> = {
  title: 'Dev/PerformanceMonitor',
  component: PerformanceMonitor,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    Story => {
      // Mock performance metrics
      const monitor = Monitor.getInstance();
      const mockMetrics = [
        {
          componentName: 'TestComponent',
          metricName: 'renderTime',
          value: 45,
          timestamp: Date.now() - 5000,
        },
        {
          componentName: 'TestComponent',
          metricName: 'updateTime',
          value: 25,
          timestamp: Date.now() - 4000,
        },
        {
          componentName: 'TestComponent',
          metricName: 'frameTime',
          value: 16.5,
          timestamp: Date.now() - 3000,
        },
        {
          componentName: 'TestComponent',
          metricName: 'memoryUsage',
          value: 30 * 1024 * 1024,
          timestamp: Date.now() - 2000,
        },
      ];

      // Simulate metrics over time
      mockMetrics.forEach(metric => {
        monitor['recordMetric'](metric);
      });

      return (
        <div className="w-[800px]">
          <Story />
        </div>
      );
    },
  ],
};

export default meta;
type Story = StoryObj<typeof PerformanceMonitor>;

export const Default: Story = {
  args: {},
};

export const WithComponentName: Story = {
  args: {
    componentName: 'TestComponent',
  },
};

export const Expanded: Story = {
  args: {
    componentName: 'TestComponent',
  },
  parameters: {
    docs: {
      description: {
        story: 'Performance monitor in expanded state showing detailed metrics and charts.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const expandButton = canvasElement.querySelector('button');
    if (expandButton) {
      expandButton.click();
    }
  },
};

export const WithWarningThreshold: Story = {
  args: {
    componentName: 'TestComponent',
  },
  decorators: [
    Story => {
      const monitor = Monitor.getInstance();
      monitor.configure({
        thresholds: {
          renderTime: { warning: 40, error: 80 },
          updateTime: { warning: 20, error: 40 },
          frameTime: { warning: 16, error: 32 },
          memoryUsage: { warning: 25 * 1024 * 1024, error: 50 * 1024 * 1024 },
        },
      });

      return <Story />;
    },
  ],
};

export const WithErrorThreshold: Story = {
  args: {
    componentName: 'TestComponent',
  },
  decorators: [
    Story => {
      const monitor = Monitor.getInstance();
      monitor.configure({
        thresholds: {
          renderTime: { warning: 30, error: 40 },
          updateTime: { warning: 15, error: 25 },
          frameTime: { warning: 14, error: 16 },
          memoryUsage: { warning: 20 * 1024 * 1024, error: 30 * 1024 * 1024 },
        },
      });

      return <Story />;
    },
  ],
};

export const DarkMode: Story = {
  args: {
    componentName: 'TestComponent',
  },
  parameters: {
    themes: {
      defaultTheme: 'dark',
    },
  },
};
