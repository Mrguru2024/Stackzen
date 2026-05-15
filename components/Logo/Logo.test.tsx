import React from 'react';
import { render, screen } from '@testing-library/react';
import Logo from '../StackzenLogo.tsx';

describe('Logo Component', () => {
  it('renders the logo correctly', () => {
    render(<Logo />);

    const logo = screen.getByAltText('StackZen Logo');
    expect(logo).toBeInTheDocument();
  });

  it('renders with correct link', () => {
    render(<Logo />);

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/');
  });

  it('applies correct size classes', () => {
    const { container } = render(<Logo size="lg" />);

    const logoContainer = container.firstChild;
    expect(logoContainer).toHaveClass('h-12', 'w-12');
  });

  it('applies custom className', () => {
    const { container } = render(<Logo className="custom-class" />);

    const logoContainer = container.firstChild;
    expect(logoContainer).toHaveClass('custom-class');
  });

  it('handles different sizes correctly', () => {
    const sizes = ['sm', 'md', 'lg', 'xl', '64', '256'] as const;

    sizes.forEach(size => {
      const { container } = render(<Logo size={size} />);
      const logoContainer = container.firstChild;
      expect(logoContainer).toHaveClass('relative');
    });
  });
});
