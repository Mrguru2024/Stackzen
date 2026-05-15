import React from 'react';
import { render, screen } from '@testing-library/react';
import Progress from './index';

describe('Progress', () => {
  it('renders correctly with default value', () => {
    render(<Progress />);
    const progress = screen.getByTestId('progress-bar');
    expect(progress).toBeInTheDocument();
    expect(progress).toHaveClass('bg-secondary');
  });

  it('renders correctly with a value of 50', () => {
    render(<Progress value={50} />);
    const progress = screen.getByTestId('progress-bar');
    expect(progress).toBeInTheDocument();
    const _innerDiv = progress.firstChild as HTMLElement;
    expect(_innerDiv).toHaveStyle({ transform: 'translateX(-50%)' });
  });

  it('renders correctly with a value of 100', () => {
    render(<Progress value={100} />);
    const progress = screen.getByTestId('progress-bar');
    expect(progress).toBeInTheDocument();
    const _innerDiv = progress.firstChild as HTMLElement;
    expect(_innerDiv).toHaveStyle({ transform: 'translateX(0%)' });
  });
});
