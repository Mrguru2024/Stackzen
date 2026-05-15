import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { ResolutionStats } from './ResolutionStats.tsx';

const meta: Meta<typeof ResolutionStats> = {
  title: 'Dev/ResolutionStats',
  component: ResolutionStats,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ResolutionStats>;

const generateMockResolutions = (count: number) => {
  const resolutions = [];
  const now = Date.now();
  const hourMs = 60 * 60 * 1000;
  const statuses = ['open', 'in_progress', 'resolved', 'ignored'] as const;
  const assignees = ['John Doe', 'Jane Smith', 'Bob Johnson', 'Alice Brown'];

  for (let i = 0; i < count; i++) {
    const createdAt = new Date(now - (count - i) * hourMs);
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const assignedTo = assignees[Math.floor(Math.random() * assignees.length)];
    const resolutionTime = status === 'resolved' ? Math.floor(Math.random() * 120) : undefined;

    resolutions.push({
      id: Math.random().toString(36).substr(2, 9),
      anomalyId: Math.random().toString(36).substr(2, 9),
      status,
      assignedTo,
      notes: `Resolution notes for issue ${i + 1}`,
      createdAt,
      updatedAt: new Date(createdAt.getTime() + (resolutionTime ? resolutionTime * 60 * 1000 : 0)),
      resolutionTime,
    });
  }

  return resolutions;
};

export const Default: Story = {
  args: {
    resolutions: generateMockResolutions(50),
    timeWindow: '24h',
  },
};

export const ShortTimeWindow: Story = {
  args: {
    resolutions: generateMockResolutions(10),
    timeWindow: '1h',
  },
};

export const LongTimeWindow: Story = {
  args: {
    resolutions: generateMockResolutions(168),
    timeWindow: '7d',
  },
};

export const ManyResolutions: Story = {
  args: {
    resolutions: generateMockResolutions(200),
    timeWindow: '24h',
  },
};

export const DarkMode: Story = {
  args: {
    resolutions: generateMockResolutions(50),
    timeWindow: '24h',
  },
  parameters: {
    themes: {
      defaultTheme: 'dark',
    },
  },
};
