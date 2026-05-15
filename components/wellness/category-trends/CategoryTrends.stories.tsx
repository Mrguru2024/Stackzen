import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import CategoryTrends from './CategoryTrends.tsx';
import { WellnessScore } from '@/lib/types/wellness';
import { WELLNESS_CATEGORIES } from '@/lib/constants/wellness';

const meta: Meta<typeof CategoryTrends> = {
  title: 'Wellness/CategoryTrends',
  component: CategoryTrends,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof CategoryTrends>;

const generateMockScores = (count: number): WellnessScore[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `score-${i}`,
    userId: 'user1',
    totalScore: Math.floor(Math.random() * 40) + 60,
    status: ['excellent', 'good', 'fair', 'at-risk'][Math.floor(Math.random() * 4)],
    color: '#5E2DEB',
    description: 'Financial health status',
    timestamp: new Date(2024, 0, i + 1).toISOString(),
    categoryScores: Object.fromEntries(
      WELLNESS_CATEGORIES.map(category => [category, Math.floor(Math.random() * 40) + 60])
    ),
    recommendations: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));
};

export const Default: Story = {
  args: {
    scores: generateMockScores(12),
  },
};

export const ShortHistory: Story = {
  args: {
    scores: generateMockScores(3),
  },
};

export const LongHistory: Story = {
  args: {
    scores: generateMockScores(24),
  },
};

export const ImprovingTrends: Story = {
  args: {
    scores: Array.from({ length: 12 }, (_, i) => ({
      id: `score-${i}`,
      userId: 'user1',
      totalScore: 60 + i * 3,
      status: i < 3 ? 'at-risk' : i < 6 ? 'fair' : i < 9 ? 'good' : 'excellent',
      color: '#5E2DEB',
      description: 'Financial health status',
      timestamp: new Date(2024, 0, i + 1).toISOString(),
      categoryScores: Object.fromEntries(
        WELLNESS_CATEGORIES.map(category => [
          category,
          60 + i * 3 + Math.floor(Math.random() * 10) - 5,
        ])
      ),
      recommendations: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })),
  },
};

export const DecliningTrends: Story = {
  args: {
    scores: Array.from({ length: 12 }, (_, i) => ({
      id: `score-${i}`,
      userId: 'user1',
      totalScore: 90 - i * 3,
      status: i < 3 ? 'excellent' : i < 6 ? 'good' : i < 9 ? 'fair' : 'at-risk',
      color: '#5E2DEB',
      description: 'Financial health status',
      timestamp: new Date(2024, 0, i + 1).toISOString(),
      categoryScores: Object.fromEntries(
        WELLNESS_CATEGORIES.map(category => [
          category,
          90 - i * 3 + Math.floor(Math.random() * 10) - 5,
        ])
      ),
      recommendations: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })),
  },
};
