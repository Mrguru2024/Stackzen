import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import PlanningCoach, { PlanningCoachProps } from './index';

jest.mock('@/lib/ai/fingpt', () => ({
  callFinGPT: jest.fn(() => Promise.resolve('You can afford to take time off!')),
}));

describe('PlanningCoach', () => {
  const defaultProps: PlanningCoachProps = {
    income: 5000,
    expenses: 3000,
    timeOffDays: 5,
  };

  it('renders with props', () => {
    render(<PlanningCoach {...defaultProps} />);
    expect(screen.getByText('Planning Coach')).toBeInTheDocument();
    expect(screen.getByDisplayValue('5000')).toBeInTheDocument();
    expect(screen.getByDisplayValue('3000')).toBeInTheDocument();
    expect(screen.getByDisplayValue('5')).toBeInTheDocument();
  });

  it('shows answer after asking a question', async () => {
    render(<PlanningCoach {...defaultProps} />);
    fireEvent.change(screen.getByLabelText('Ask a question'), {
      target: { value: 'Can I afford a vacation?' },
    });
    fireEvent.click(screen.getByText('Ask Coach'));
    await waitFor(() => {
      expect(screen.getByText('Coach says:')).toBeInTheDocument();
      expect(screen.getByText('You can afford to take time off!')).toBeInTheDocument();
    });
  });
});
