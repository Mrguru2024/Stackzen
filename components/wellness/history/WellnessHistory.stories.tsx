import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import WellnessHistory from './WellnessHistory.tsx';
import { WellnessScore } from '@/lib/types/wellness';

const meta: Meta<typeof WellnessHistory> = {
  title: 'Wellness/History',
  component: WellnessHistory,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof WellnessHistory>;

const generateMockScores = (count: number): WellnessScore[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `score-${i}`,
    userId: 'user1',
    totalScore: Math.floor(Math.random() * 40) + 60, // Random score between 60-100
    status: ['excellent', 'good', 'fair', 'at-risk'][Math.floor(Math.random() * 4)],
    color: '#5E2DEB',
    description: 'Financial health status',
    timestamp: new Date(2024, 0, i + 1).toISOString(),
    categoryScores: {},
    recommendations: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));
};

export const Default: Story = {
  args: {
    scores: generateMockScores(12), // 12 months of data
  },
};

export const ShortHistory: Story = {
  args: {
    scores: generateMockScores(3), // 3 months of data
  },
};

export const LongHistory: Story = {
  args: {
    scores: generateMockScores(24), // 24 months of data
  },
};

export const ImprovingTrend: Story = {
  args: {
    scores: Array.from({ length: 12 }, (_, i) => ({
      id: `score-${i}`,
      userId: 'user1',
      totalScore: 60 + i * 3, // Gradually improving from 60 to 96
      status: i < 3 ? 'at-risk' : i < 6 ? 'fair' : i < 9 ? 'good' : 'excellent',
      color: '#5E2DEB',
      description: 'Financial health status',
      timestamp: new Date(2024, 0, i + 1).toISOString(),
      categoryScores: {},
      recommendations: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })),
  },
};

export const DecliningTrend: Story = {
  args: {
    scores: Array.from({ length: 12 }, (_, i) => ({
      id: `score-${i}`,
      userId: 'user1',
      totalScore: 90 - i * 3, // Gradually declining from 90 to 54
      status: i < 3 ? 'excellent' : i < 6 ? 'good' : i < 9 ? 'fair' : 'at-risk',
      color: '#5E2DEB',
      description: 'Financial health status',
      timestamp: new Date(2024, 0, i + 1).toISOString(),
      categoryScores: {},
      recommendations: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })),
  },
};
