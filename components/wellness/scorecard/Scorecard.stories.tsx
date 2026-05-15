import type { Meta, StoryObj } from '@storybook/react';
import WellnessScorecard from './index.tsx';
import { UserFinancialData } from '@/lib/types/wellness';

const meta: Meta<typeof WellnessScorecard> = {
  title: 'Wellness/Scorecard',
  component: WellnessScorecard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof WellnessScorecard>;

// Sample data for stories
const sampleUserData: UserFinancialData = {
  incomeData: {
    sources: [
      { name: 'Salary', amount: 5000, frequency: 'monthly' },
      { name: 'Freelance', amount: 1000, frequency: 'monthly' },
    ],
    allocation: {
      needs: 40,
      savings: 30,
      investments: 30,
    },
    monthsWithIncome: 12,
  },
  savingsData: {
    rate: 15,
    totalSavings: 30000,
    monthlyIncome: 6000,
  },
  debtData: {
    totalDebt: 10000,
    monthlyPayments: 500,
    monthlyIncome: 6000,
  },
  emergencyFund: {
    months: 6,
  },
  investmentData: {
    growthRate: 8,
    diversification: 0.7,
  },
  goals: [
    {
      id: '1',
      name: 'Emergency Fund',
      target: 30000,
      current: 30000,
      deadline: new Date('2024-12-31'),
      category: 'savings',
      status: 'active',
    },
    {
      id: '2',
      name: 'New Car',
      target: 25000,
      current: 15000,
      deadline: new Date('2025-06-30'),
      category: 'savings',
      status: 'active',
    },
  ],
};

const atRiskUserData: UserFinancialData = {
  incomeData: {
    sources: [{ name: 'Salary', amount: 3000, frequency: 'monthly' }],
    allocation: {
      needs: 70,
      savings: 20,
      investments: 10,
    },
    monthsWithIncome: 3,
  },
  savingsData: {
    rate: 5,
    totalSavings: 5000,
    monthlyIncome: 3000,
  },
  debtData: {
    totalDebt: 25000,
    monthlyPayments: 1000,
    monthlyIncome: 3000,
  },
  emergencyFund: {
    months: 1,
  },
  investmentData: {
    growthRate: 2,
    diversification: 0.3,
  },
  goals: [],
};

const excellentUserData: UserFinancialData = {
  incomeData: {
    sources: [
      { name: 'Salary', amount: 8000, frequency: 'monthly' },
      { name: 'Investments', amount: 2000, frequency: 'monthly' },
      { name: 'Rental', amount: 1500, frequency: 'monthly' },
    ],
    allocation: {
      needs: 35,
      savings: 35,
      investments: 30,
    },
    monthsWithIncome: 24,
  },
  savingsData: {
    rate: 25,
    totalSavings: 100000,
    monthlyIncome: 11500,
  },
  debtData: {
    totalDebt: 0,
    monthlyPayments: 0,
    monthlyIncome: 11500,
  },
  emergencyFund: {
    months: 12,
  },
  investmentData: {
    growthRate: 12,
    diversification: 0.9,
  },
  goals: [
    {
      id: '1',
      name: 'Retirement',
      target: 1000000,
      current: 750000,
      deadline: new Date('2030-12-31'),
      category: 'investments',
      status: 'active',
    },
  ],
};

export const Default: Story = {
  args: {
    userData: sampleUserData,
    showRecommendations: true,
    showHistory: true,
  },
};

export const AtRisk: Story = {
  args: {
    userData: atRiskUserData,
    showRecommendations: true,
    showHistory: true,
  },
};

export const Excellent: Story = {
  args: {
    userData: excellentUserData,
    showRecommendations: true,
    showHistory: true,
  },
};

export const WithoutRecommendations: Story = {
  args: {
    userData: sampleUserData,
    showRecommendations: false,
    showHistory: true,
  },
};

export const WithoutHistory: Story = {
  args: {
    userData: sampleUserData,
    showRecommendations: true,
    showHistory: false,
  },
};
