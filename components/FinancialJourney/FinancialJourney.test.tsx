import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import FinancialJourney from './index';
import { useSession } from 'next-auth/react';

// Mock the data fetching
jest.mock('./useFinancialJourney', () => ({
  useFinancialJourney: () => ({
    data: {
      milestones: [
        {
          id: '1',
          title: 'Getting Started',
          description: 'Begin your financial journey',
          criteria: ['Set up budget', 'Connect bank account'],
          recommendations: ['Start with a simple budget', 'Track your expenses'],
          progress: 100,
        },
        {
          id: '2',
          title: 'Building Foundation',
          description: 'Establish financial stability',
          criteria: ['Emergency fund', 'Debt reduction'],
          recommendations: ['Save 3-6 months of expenses', 'Pay off high-interest debt'],
          progress: 65,
        },
      ],
      selectedMilestone: null,
    },
    isLoading: false,
    error: null,
    selectMilestone: jest.fn(),
  }),
}));

jest.mock('next-auth/react', () => ({
  useSession: () => ({ data: { user: { name: 'Test User' } }, status: 'authenticated' }),
}));

describe('FinancialJourney', () => {
  it('renders the component with initial state', () => {
    render(<FinancialJourney />);

    // Check if main heading is rendered
    expect(screen.getByText('Your Financial Journey')).toBeInTheDocument();

    // Check if all milestones are rendered
    expect(screen.getByText('Getting Started')).toBeInTheDocument();
    expect(screen.getByText('Building Foundation')).toBeInTheDocument();

    // Check if placeholder is shown
    expect(
      screen.getByText('Select a milestone to view details and recommendations')
    ).toBeInTheDocument();
  });

  it('shows milestone details when clicked', () => {
    render(<FinancialJourney />);

    // Click on the first milestone
    fireEvent.click(screen.getByText('Getting Started'));

    // Check if details are shown
    expect(screen.getByText('Criteria')).toBeInTheDocument();
    expect(screen.getByText('Set up budget')).toBeInTheDocument();
    expect(screen.getByText('Connect bank account')).toBeInTheDocument();

    expect(screen.getByText('Recommendations')).toBeInTheDocument();
    expect(screen.getByText('Start with a simple budget')).toBeInTheDocument();
    expect(screen.getByText('Track your expenses')).toBeInTheDocument();
  });

  it('shows completion status correctly', () => {
    render(<FinancialJourney />);

    // First milestone should be completed (100%)
    const firstMilestone = screen.getByText('Getting Started').closest('div');
    expect(firstMilestone).toHaveStyle({ width: '100%' });

    // Second milestone should be partially completed (65%)
    const secondMilestone = screen.getByText('Building Foundation').closest('div');
    expect(secondMilestone).toHaveStyle({ width: '65%' });
  });

  it('shows error state when data fails to load', () => {
    // Mock error state
    jest.spyOn(require('./useFinancialJourney.ts'), 'useFinancialJourney').mockReturnValue({
      data: null,
      isLoading: false,
      error: new Error('Failed to load data'),
      selectMilestone: jest.fn(),
    });

    render(<FinancialJourney />);

    expect(
      screen.getByText('Error loading financial journey data. Please try again later.')
    ).toBeInTheDocument();
  });
});
