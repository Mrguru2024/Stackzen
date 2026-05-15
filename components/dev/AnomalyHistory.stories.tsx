import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { AnomalyHistory } from './AnomalyHistory.tsx';

const meta: Meta<typeof AnomalyHistory> = {
  title: 'Dev/AnomalyHistory',
  component: AnomalyHistory,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof AnomalyHistory>;

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
    anomalies: generateMockAnomalies(20),
    onExport: anomalies => {
      console.log('Exporting anomalies:', anomalies);
    },
  },
};

export const Empty: Story = {
  args: {
    anomalies: [],
    onExport: anomalies => {
      console.log('Exporting anomalies:', anomalies);
    },
  },
};

export const ManyAnomalies: Story = {
  args: {
    anomalies: generateMockAnomalies(50),
    onExport: anomalies => {
      console.log('Exporting anomalies:', anomalies);
    },
  },
};

export const DarkMode: Story = {
  args: {
    anomalies: generateMockAnomalies(20),
    onExport: anomalies => {
      console.log('Exporting anomalies:', anomalies);
    },
  },
  parameters: {
    themes: {
      defaultTheme: 'dark',
    },
  },
};
