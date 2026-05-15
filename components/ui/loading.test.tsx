import React from 'react';
import { render, screen } from '@testing-library/react';
import { Loading } from './Loading';
import { Loading } from './loading.tsx';

describe('Loading', () => {
  it('renders with default props', () => {
    render(<Loading />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders with custom text', () => {
    render(<Loading text="Please wait..." />);
    expect(screen.getByText('Please wait...')).toBeInTheDocument();
  });

  it('renders with different sizes', () => {
    const { rerender } = render(<Loading size="sm" />);
    const loader = screen.getByTestId('loading-spinner');
    expect(loader).toHaveClass('w-4 h-4');

    rerender(<Loading size="md" />);
    expect(loader).toHaveClass('w-6 h-6');

    rerender(<Loading size="lg" />);
    expect(loader).toHaveClass('w-8 h-8');
  });

  it('renders without text when text prop is empty', () => {
    render(<Loading text="" />);
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
  });
});
