import React from 'react';
import { render, screen } from '@testing-library/react';
import GrantsComingSoon from './index';

describe('GrantsComingSoon', () => {
  it('renders coming soon messaging and planned features', () => {
    render(<GrantsComingSoon />);

    expect(screen.getByRole('heading', { name: /Funding Finder/i })).toBeInTheDocument();
    expect(screen.getByText(/Coming soon/i)).toBeInTheDocument();
    expect(screen.getByText(/Live grant listings from trusted public sources/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Back to Income/i })).toHaveAttribute('href', '/income');
    expect(screen.getByRole('link', { name: /Dashboard/i })).toHaveAttribute('href', '/dashboard');
  });
});
