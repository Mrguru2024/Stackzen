import React from 'react';
import { render, screen } from '@testing-library/react';
import { Badge } from './index';

describe('Badge', () => {
  it('renders correctly with default variant', () => {
    render(<Badge>Default Badge</Badge>);
    const _badge = screen.getByText('Default Badge');
    expect(_badge).toBeInTheDocument();
    expect(_badge).toHaveClass('bg-primary');
  });

  it('renders correctly with secondary variant', () => {
    render(<Badge variant="secondary">Secondary Badge</Badge>);
    const _badge = screen.getByText('Secondary Badge');
    expect(_badge).toBeInTheDocument();
    expect(_badge).toHaveClass('bg-secondary');
  });

  it('renders correctly with outline variant', () => {
    render(<Badge variant="outline">Outline Badge</Badge>);
    const _badge = screen.getByText('Outline Badge');
    expect(_badge).toBeInTheDocument();
    expect(_badge).toHaveClass('text-foreground');
  });

  it('renders correctly with destructive variant', () => {
    render(<Badge variant="destructive">Destructive Badge</Badge>);
    const _badge = screen.getByText('Destructive Badge');
    expect(_badge).toBeInTheDocument();
    expect(_badge).toHaveClass('bg-destructive');
  });
});
