import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import OnboardingStepSetupIncome from './index.tsx';

describe('OnboardingStepSetupIncome', () => {
  it('renders setup income form', () => {
    const onNext = jest.fn();
    render(<OnboardingStepSetupIncome onNext={onNext} />);
    expect(screen.getByText('Income Setup')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('e.g., Main Job, Freelance')).toBeInTheDocument();
    expect(screen.getByText('Continue')).toBeInTheDocument();
  });

  it('calls onNext with income value when form is submitted', () => {
    const onNext = jest.fn();
    render(<OnboardingStepSetupIncome onNext={onNext} />);
    const _input = screen.getByPlaceholderText('e.g., Main Job, Freelance');
    fireEvent.change(_input, { target: { value: 'Freelance' } });
    fireEvent.click(screen.getByText('Continue'));
    expect(onNext).toHaveBeenCalled();
  });
});
