import React from 'react';
import { render, screen } from '@testing-library/react';
import LoadingSpinner from './index';

describe('LoadingSpinner', () => {
  it('renders with default props', () => {
    render(<LoadingSpinner />);
    const spinner = screen.getByRole('status');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass('h-6 w-6');
    expect(spinner).toHaveClass('text-primary');
  });

  it('renders with different sizes', () => {
    const { rerender } = render(<LoadingSpinner size="sm" />);
    expect(screen.getByRole('status')).toHaveClass('h-4 w-4');

    rerender(<LoadingSpinner size="lg" />);
    expect(screen.getByRole('status')).toHaveClass('h-8 w-8');

    rerender(<LoadingSpinner size="xl" />);
    expect(screen.getByRole('status')).toHaveClass('h-12 w-12');
  });

  it('renders with different variants', () => {
    const { rerender } = render(<LoadingSpinner variant="secondary" />);
    expect(screen.getByRole('status')).toHaveClass('text-secondary');

    rerender(<LoadingSpinner variant="muted" />);
    expect(screen.getByRole('status')).toHaveClass('text-muted-foreground');

    rerender(<LoadingSpinner variant="white" />);
    expect(screen.getByRole('status')).toHaveClass('text-white');
  });

  it('renders in fullscreen mode', () => {
    render(<LoadingSpinner fullScreen />);
    const container = screen.getByRole('status').parentElement;
    expect(container).toHaveClass('fixed inset-0');
    expect(container).toHaveClass('flex items-center justify-center');
    expect(container).toHaveClass('bg-background/80');
    expect(container).toHaveClass('backdrop-blur-sm');
  });

  it('applies custom className', () => {
    render(<LoadingSpinner className="custom-class" />);
    expect(screen.getByRole('status')).toHaveClass('custom-class');
  });
});
