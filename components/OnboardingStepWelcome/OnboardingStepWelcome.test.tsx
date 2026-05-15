import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { OnboardingStepWelcome } from './index.tsx';

describe('OnboardingStepWelcome', () => {
  it('renders welcome message and button', () => {
    const onNext = jest.fn();
    render(<OnboardingStepWelcome onNext={onNext} />);
    expect(screen.getByText('Welcome to StackZen')).toBeInTheDocument();
    expect(screen.getByText('Get Started')).toBeInTheDocument();
  });

  it('calls onNext when button is clicked', () => {
    const onNext = jest.fn();
    render(<OnboardingStepWelcome onNext={onNext} />);
    fireEvent.click(screen.getByText('Get Started'));
    expect(onNext).toHaveBeenCalled();
  });
});
