import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { AnomalyResolution } from './AnomalyResolution.tsx';

const meta: Meta<typeof AnomalyResolution> = {
  title: 'Dev/AnomalyResolution',
  component: AnomalyResolution,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof AnomalyResolution>;

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
      id: Math.random().toString(36).substr(2, 9),
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
    anomalies: generateMockAnomalies(5),
    onResolutionUpdate: resolution => {
      console.log('Resolution updated:', resolution);
    },
  },
};

export const ManyAnomalies: Story = {
  args: {
    anomalies: generateMockAnomalies(20),
    onResolutionUpdate: resolution => {
      console.log('Resolution updated:', resolution);
    },
  },
};

export const NoAnomalies: Story = {
  args: {
    anomalies: [],
    onResolutionUpdate: resolution => {
      console.log('Resolution updated:', resolution);
    },
  },
};

export const DarkMode: Story = {
  args: {
    anomalies: generateMockAnomalies(5),
    onResolutionUpdate: resolution => {
      console.log('Resolution updated:', resolution);
    },
  },
  parameters: {
    themes: {
      defaultTheme: 'dark',
    },
  },
};
