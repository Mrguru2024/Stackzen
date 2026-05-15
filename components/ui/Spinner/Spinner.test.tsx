import React from 'react';
import { render } from '@testing-library/react';
import { Spinner } from './index';

describe('Spinner Component', () => {
  it('renders the spinner correctly', () => {
    const { container } = render(<Spinner />);

    const spinner = container.querySelector('svg');
    expect(spinner).toBeInTheDocument();
  });

  it('has the correct default classes', () => {
    const { container } = render(<Spinner />);

    const spinner = container.querySelector('svg');
    expect(spinner).toHaveClass('animate-spin', 'h-4', 'w-4');
  });

  it('applies custom className', () => {
    const { container } = render(<Spinner className="custom-class" />);

    const spinner = container.querySelector('svg');
    expect(spinner).toHaveClass('custom-class');
  });

  it('applies correct size classes', () => {
    const { container: smallContainer } = render(<Spinner size="sm" />);
    const { container: mediumContainer } = render(<Spinner size="md" />);
    const { container: largeContainer } = render(<Spinner size="lg" />);

    const smallSpinner = smallContainer.querySelector('svg');
    const mediumSpinner = mediumContainer.querySelector('svg');
    const largeSpinner = largeContainer.querySelector('svg');

    expect(smallSpinner).toHaveClass('h-3', 'w-3');
    expect(mediumSpinner).toHaveClass('h-4', 'w-4');
    expect(largeSpinner).toHaveClass('h-6', 'w-6');
  });

  it('passes through additional props', () => {
    const { container } = render(<Spinner data-testid="spinner" />);

    const spinner = container.querySelector('svg');
    expect(spinner).toHaveAttribute('data-testid', 'spinner');
  });

  it('has correct display name', () => {
    expect(Spinner.displayName).toBe('Spinner');
  });
});
