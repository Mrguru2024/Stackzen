import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import CategoryRecommendations from './CategoryRecommendations.tsx';
import { WellnessScore } from '@/lib/types/wellness';
// import { _WELLNESS_CATEGORIES } from '@/constants/wellness'; // Unused

const meta: Meta<typeof CategoryRecommendations> = {
  title: 'Wellness/CategoryRecommendations',
  component: CategoryRecommendations,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof CategoryRecommendations>;

const generateMockScore = (categoryScores: Record<string, number>): WellnessScore => ({
  id: '1',
  userId: 'user1',
  totalScore:
    Object.values(categoryScores).reduce((a, b) => a + b, 0) / Object.keys(categoryScores).length,
  status: 'good',
  color: '#5E2DEB',
  description: 'Financial health status',
  timestamp: new Date().toISOString(),
  categoryScores,
  recommendations: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

export const Default: Story = {
  args: {
    scores: [
      generateMockScore({
        income: 85,
        savings: 75,
        debt: 90,
        emergency: 80,
        investments: 70,
        goals: 65,
      }),
    ],
  },
};

export const ExcellentScores: Story = {
  args: {
    scores: [
      generateMockScore({
        income: 95,
        savings: 90,
        debt: 95,
        emergency: 90,
        investments: 85,
        goals: 80,
      }),
    ],
  },
};

export const NeedsImprovement: Story = {
  args: {
    scores: [
      generateMockScore({
        income: 60,
        savings: 55,
        debt: 50,
        emergency: 45,
        investments: 40,
        goals: 35,
      }),
    ],
  },
};

export const MixedScores: Story = {
  args: {
    scores: [
      generateMockScore({
        income: 95,
        savings: 90,
        debt: 40,
        emergency: 35,
        investments: 85,
        goals: 80,
      }),
    ],
  },
};
