import React from 'react';
import { render, screen } from '@testing-library/react';
import Settings from './index';

describe('Settings', () => {
  it('renders settings headings and user info', async () => {
    render(<Settings />);

    // Headings
    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.getByText('Preferences')).toBeInTheDocument();
    expect(screen.getByText('AI Features')).toBeInTheDocument();

    // Static labels
    expect(screen.getByText(/Name:/i)).toBeInTheDocument();
    expect(screen.getByText(/Email:/i)).toBeInTheDocument();
    expect(screen.getByText(/Theme:/i)).toBeInTheDocument();
    expect(screen.getByText(/Opt out of AI features:/i)).toBeInTheDocument();
    expect(screen.getByText(/Theme toggle coming soon/i)).toBeInTheDocument();
    expect(screen.getByText(/Change coming soon/i)).toBeInTheDocument();
  });
});
