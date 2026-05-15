import React from 'react';
import { render, screen } from '@testing-library/react';
import OnboardingDataCard from './index';

describe('OnboardingDataCard', () => {
  it('renders with correct data', () => {
    const _mockData = {
      monthlyIncome: 5000,
      needsAllocation: 50,
      wantsAllocation: 30,
      savingsAllocation: 20,
      recommendations: ['Save for emergency fund', 'Pay off credit card debt'],
      bankConnected: true,
    };

    render(<OnboardingDataCard data={_mockData} />);

    // Check for income
    expect(screen.getByText(/\$5,?0?0?0?\.00/)).toBeInTheDocument();

    // Check for allocations
    expect(screen.getByText('50%')).toBeInTheDocument();
    expect(screen.getByText('30%')).toBeInTheDocument();
    expect(screen.getByText('20%')).toBeInTheDocument();

    // Check for recommendations
    expect(screen.getByText('Save for emergency fund')).toBeInTheDocument();
    expect(screen.getByText('Pay off credit card debt')).toBeInTheDocument();

    // Check for bank connection status
    expect(screen.getByText('Bank account connected')).toBeInTheDocument();
  });

  it('renders with zero values when no data provided', () => {
    render(<OnboardingDataCard data={null} />);

    // Check for error message
    expect(screen.getByText(/no data available/i)).toBeInTheDocument();
  });
});
