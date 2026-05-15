import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import OnboardingStepSetupGoals from './index.tsx';

describe('OnboardingStepSetupGoals', () => {
  it('renders setup goals form', () => {
    const onNext = jest.fn();
    render(<OnboardingStepSetupGoals onNext={onNext} />);
    expect(screen.getByText('Setup Your Goals')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter a goal')).toBeInTheDocument();
    expect(screen.getByText('Add Goal')).toBeInTheDocument();
    expect(screen.getByText('Next')).toBeInTheDocument();
  });

  it('calls onNext with goals when form is submitted', () => {
    const onNext = jest.fn();
    render(<OnboardingStepSetupGoals onNext={onNext} />);
    const _input = screen.getByPlaceholderText('Enter a goal');
    fireEvent.change(_input, { target: { value: 'Save for a house' } });
    fireEvent.click(screen.getByText('Add Goal'));
    fireEvent.click(screen.getByText('Next'));
    expect(onNext).toHaveBeenCalledWith(['Save for a house']);
  });
});
