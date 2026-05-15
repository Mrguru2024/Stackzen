import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import OnboardingStepComplete from './index.tsx';

describe('OnboardingStepComplete', () => {
  it('renders completion message and button', () => {
    const onFinish = jest.fn();
    render(<OnboardingStepComplete onFinish={onFinish} />);
    expect(screen.getByText('Onboarding Complete!')).toBeInTheDocument();
    expect(screen.getByText('Finish')).toBeInTheDocument();
  });

  it('calls onFinish when button is clicked', () => {
    const onFinish = jest.fn();
    render(<OnboardingStepComplete onFinish={onFinish} />);
    fireEvent.click(screen.getByText('Finish'));
    expect(onFinish).toHaveBeenCalled();
  });
});
