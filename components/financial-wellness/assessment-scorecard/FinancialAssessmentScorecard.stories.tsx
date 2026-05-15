import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import FinancialAssessmentScorecard from './FinancialAssessmentScorecard.tsx';

const meta: Meta<typeof FinancialAssessmentScorecard> = {
  title: 'Financial Wellness/Assessment Scorecard',
  component: FinancialAssessmentScorecard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof FinancialAssessmentScorecard>;

const mockAssessment = {
  id: '1',
  userId: 'user1',
  score: 75,
  categories: {
    income: {
      score: 80,
      metrics: {
        stability: 85,
        growth: 75,
        diversity: 80,
      },
    },
    savings: {
      score: 70,
      metrics: {
        emergency: 65,
        retirement: 75,
        shortTerm: 70,
      },
    },
    debt: {
      score: 65,
      metrics: {
        utilization: 70,
        payments: 60,
        types: 65,
      },
    },
    investments: {
      score: 85,
      metrics: {
        diversification: 90,
        returns: 80,
        risk: 85,
      },
    },
  },
  recommendations: [
    'Increase emergency fund to 6 months of expenses',
    'Diversify income sources',
    'Review investment portfolio allocation',
  ],
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const Default: Story = {
  args: {
    assessment: mockAssessment,
  },
};

export const HighScore: Story = {
  args: {
    assessment: {
      ...mockAssessment,
      score: 90,
      categories: {
        ...mockAssessment.categories,
        income: { ...mockAssessment.categories.income, score: 95 },
        savings: { ...mockAssessment.categories.savings, score: 90 },
        debt: { ...mockAssessment.categories.debt, score: 85 },
        investments: { ...mockAssessment.categories.investments, score: 90 },
      },
    },
  },
};

export const LowScore: Story = {
  args: {
    assessment: {
      ...mockAssessment,
      score: 45,
      categories: {
        ...mockAssessment.categories,
        income: { ...mockAssessment.categories.income, score: 50 },
        savings: { ...mockAssessment.categories.savings, score: 40 },
        debt: { ...mockAssessment.categories.debt, score: 35 },
        investments: { ...mockAssessment.categories.investments, score: 55 },
      },
    },
  },
};
