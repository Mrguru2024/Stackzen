import React from 'react';
import { render, screen } from '@testing-library/react';
import { Separator } from './index';

describe('Separator', () => {
  it('renders with default props', () => {
    render(<Separator />);
    const separator = screen.getByRole('separator');
    expect(separator).toBeInTheDocument();
    expect(separator).toHaveClass('w-full h-px my-4');
    expect(separator).toHaveAttribute('aria-orientation', 'horizontal');
  });

  it('renders with custom className', () => {
    render(<Separator className="custom-class" />);
    const separator = screen.getByRole('separator');
    expect(separator).toHaveClass('custom-class');
  });

  it('renders with vertical orientation', () => {
    render(<Separator orientation="vertical" />);
    const separator = screen.getByRole('separator');
    expect(separator).toHaveClass('h-full w-px mx-4');
    expect(separator).toHaveAttribute('aria-orientation', 'vertical');
  });

  it('forwards ref correctly', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(<Separator ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('applies dark mode styles', () => {
    render(<Separator />);
    const separator = screen.getByRole('separator');
    expect(separator).toHaveClass('dark:bg-gray-700');
  });

  it('forwards additional props', () => {
    render(<Separator data-testid="test-separator" />);
    const separator = screen.getByTestId('test-separator');
    expect(separator).toBeInTheDocument();
  });
});
