import React from 'react';
import { render, screen } from '@testing-library/react';
import Gigs from './index.tsx';
// import Gigs from '@/components/gigs/Gigs';
describe('Gigs', () => {
  it('renders gig titles', async () => {
    const Gigs = (await import('./index')).default;
    render(<Gigs />);
    expect(screen.getByText('Freelance Designer')).toBeInTheDocument();
    expect(screen.getByText('Delivery Driver')).toBeInTheDocument();
    expect(screen.getByText('Online Tutor')).toBeInTheDocument();
  });
});
