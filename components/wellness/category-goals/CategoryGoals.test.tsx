import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import CategoryGoals from './CategoryGoals.tsx';
import { _WELLNESS_CATEGORIES } from '@/lib/constants/wellness';

// Mock the framer-motion library
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className }: any) => <div className={className}>{children}</div>,
  },
}));

describe('CategoryGoals', () => {
  const mockScores = [{ timestamp: Date.now(), categoryScores: { Savings: 80, Spending: 60 } }];
  const mockGoals = [
    { id: '1', category: 'Savings', target: 10000, current: 5000 },
    { id: '2', category: 'Spending', target: 2000, current: 1500 },
  ];
  const mockHandlers = {
    onAddGoal: jest.fn(),
    onEditGoal: jest.fn(),
    onDeleteGoal: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the component with title and add button', () => {
    render(<CategoryGoals scores={mockScores} goals={mockGoals} {...mockHandlers} />);

    expect(screen.getByText('Category Goals')).toBeInTheDocument();
    expect(screen.getByText('Add Goal')).toBeInTheDocument();
  });

  it('displays all category buttons', () => {
    render(<CategoryGoals scores={mockScores} goals={mockGoals} {...mockHandlers} />);

    _WELLNESS_CATEGORIES.forEach(category => {
      expect(
        screen.getByText(category.charAt(0).toUpperCase() + category.slice(1))
      ).toBeInTheDocument();
    });
  });

  it('shows goals when a category is selected', () => {
    render(<CategoryGoals scores={mockScores} goals={mockGoals} {...mockHandlers} />);

    const savingsButton = screen.getByText('Savings');
    fireEvent.click(savingsButton);

    expect(screen.getByText('Emergency Fund')).toBeInTheDocument();
    expect(screen.getByText('Target: $10,000')).toBeInTheDocument();
    expect(screen.getByText('Current: $5,000')).toBeInTheDocument();
  });

  it('opens add goal form when add button is clicked', () => {
    render(<CategoryGoals scores={mockScores} goals={mockGoals} {...mockHandlers} />);

    const addButton = screen.getByText('Add Goal');
    fireEvent.click(addButton);

    expect(screen.getByText('Add New Goal')).toBeInTheDocument();
    expect(screen.getByLabelText('Select a category')).toBeInTheDocument();
  });

  it('opens edit form when edit button is clicked', () => {
    render(<CategoryGoals scores={mockScores} goals={mockGoals} {...mockHandlers} />);

    const savingsButton = screen.getByText('Savings');
    fireEvent.click(savingsButton);

    const editButton = screen.getByText('Edit');
    fireEvent.click(editButton);

    expect(screen.getByText('Edit Goal')).toBeInTheDocument();
    expect(screen.getByLabelText('Goal name')).toBeInTheDocument();
    expect(screen.getByLabelText('Goal target amount')).toBeInTheDocument();
    expect(screen.getByLabelText('Current goal progress')).toBeInTheDocument();
  });

  it('calls onDeleteGoal when delete button is clicked', () => {
    render(<CategoryGoals scores={mockScores} goals={mockGoals} {...mockHandlers} />);

    const savingsButton = screen.getByText('Savings');
    fireEvent.click(savingsButton);

    const deleteButton = screen.getByText('Delete');
    fireEvent.click(deleteButton);

    expect(mockHandlers.onDeleteGoal).toHaveBeenCalledWith('1');
  });

  it('applies custom className when provided', () => {
    const customClass = 'test-class';
    render(
      <CategoryGoals
        scores={mockScores}
        goals={mockGoals}
        {...mockHandlers}
        className={customClass}
      />
    );

    const container = screen.getByText('Category Goals').closest('div');
    expect(container?.parentElement).toHaveClass(customClass);
  });

  it('handles empty goals array', () => {
    render(<CategoryGoals scores={mockScores} goals={[]} {...mockHandlers} />);

    const savingsButton = screen.getByText('Savings');
    fireEvent.click(savingsButton);

    expect(screen.queryByText('Emergency Fund')).not.toBeInTheDocument();
  });
});
