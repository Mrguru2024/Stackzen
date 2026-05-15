import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import OnboardingStepSetupAllocation from './index';

describe('OnboardingStepSetupAllocation', () => {
  it('renders setup allocation form', () => {
    const onNext = jest.fn();
    render(<OnboardingStepSetupAllocation onNext={onNext} />);

    expect(screen.getByText('Setup Your Allocation')).toBeInTheDocument();
    expect(screen.getByRole('spinbutton', { name: /needs/i })).toBeInTheDocument();
    expect(screen.getByRole('spinbutton', { name: /wants/i })).toBeInTheDocument();
    expect(screen.getByRole('spinbutton', { name: /savings/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /continue/i })).toBeInTheDocument();
  });

  it('calls onNext with allocation values when form is submitted', () => {
    const onNext = jest.fn();
    render(<OnboardingStepSetupAllocation onNext={onNext} />);

    fireEvent.change(screen.getByRole('spinbutton', { name: /needs/i }), {
      target: { value: '50' },
    });
    fireEvent.change(screen.getByRole('spinbutton', { name: /wants/i }), {
      target: { value: '30' },
    });
    fireEvent.change(screen.getByRole('spinbutton', { name: /savings/i }), {
      target: { value: '20' },
    });
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    expect(onNext).toHaveBeenCalledWith({
      needs: 50,
      wants: 30,
      savings: 20,
    });
  });
});
