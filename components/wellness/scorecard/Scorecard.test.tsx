import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import WellnessScorecard from './index.tsx';
import { UserFinancialData } from '@/lib/types/wellness';

// Mock data for testing
const mockUserData: UserFinancialData = {
  incomeData: {
    sources: [{ name: 'Salary', amount: 5000, frequency: 'monthly' }],
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
    monthlyIncome: 5000,
  },
  debtData: {
    totalDebt: 10000,
    monthlyPayments: 500,
    monthlyIncome: 5000,
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
  ],
};

const customClass = 'test-class';
const onScoreUpdate = jest.fn();

describe('WellnessScorecard', () => {
  it('renders the component with loading state', () => {
    render(<WellnessScorecard userData={mockUserData} />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('displays the wellness score', async () => {
    render(<WellnessScorecard userData={mockUserData} />);
    const scoreElement = await screen.findByText('75');
    expect(scoreElement).toBeInTheDocument();
  });

  it('shows recommendations when enabled', async () => {
    render(<WellnessScorecard userData={mockUserData} showRecommendations={true} />);
    const recommendationsTitle = await screen.findByText('Recommendations');
    expect(recommendationsTitle).toBeInTheDocument();
  });

  it('hides recommendations when disabled', async () => {
    render(<WellnessScorecard userData={mockUserData} showRecommendations={false} />);
    const recommendationsTitle = screen.queryByText('Recommendations');
    expect(recommendationsTitle).not.toBeInTheDocument();
  });

  it('displays category scores', async () => {
    render(<WellnessScorecard userData={mockUserData} />);
    const incomeManagement = await screen.findByText('Income Management');
    expect(incomeManagement).toBeInTheDocument();
  });

  it('calls onScoreUpdate when score is calculated', async () => {
    render(<WellnessScorecard userData={mockUserData} onScoreUpdate={onScoreUpdate} />);
    await screen.findByText('75'); // Wait for score to be calculated
    expect(onScoreUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        totalScore: 75,
        status: 'Stable',
      })
    );
  });

  it('applies custom className', () => {
    render(<WellnessScorecard userData={mockUserData} className={customClass} />);
    const container = screen.getByRole('status').parentElement;
    expect(container).toHaveClass(customClass);
  });

  it('handles empty user data gracefully', () => {
    const emptyUserData: UserFinancialData = {
      incomeData: { sources: [], allocation: {} },
      savingsData: { rate: 0, totalSavings: 0, monthlyIncome: 0 },
      debtData: { totalDebt: 0, monthlyPayments: 0, monthlyIncome: 0 },
      emergencyFund: { months: 0 },
      investmentData: { growthRate: 0, diversification: 0 },
      goals: [],
    };
    render(<WellnessScorecard userData={emptyUserData} />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});
