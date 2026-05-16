import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { render, screen } from '@testing-library/react';
// import HeroSection from './HeroSection.tsx';
const HeroSection = () => <div>Mock HeroSection</div>;

describe('HeroSection', () => {
  it('renders the hero section with all elements', () => {
    render(<HeroSection />);

    // Check for main heading
    expect(screen.getByText(/Take Control of Your Income with the/i)).toBeInTheDocument();
    expect(screen.getByText(/40\/30\/30 Split/i)).toBeInTheDocument();

    // Check for subheading
    expect(
      screen.getByText(/The smart financial platform built for service providers/i)
    ).toBeInTheDocument();

    // Check for CTA buttons
    expect(screen.getByText(/Start For Free/i)).toBeInTheDocument();
    expect(screen.getByText(/Watch Demo/i)).toBeInTheDocument();

    // Check for feature tags - using getAllByText for elements that appear multiple times
    const methodTags = screen.getAllByText(/40\/30\/30 Method/i);
    expect(methodTags[0]).toBeInTheDocument();
    expect(screen.getByText(/Gig Income Tools/i)).toBeInTheDocument();
    expect(screen.getByText(/Bank Connection/i)).toBeInTheDocument();
    expect(screen.getByText(/No Credit Card/i)).toBeInTheDocument();

    // Check for mock dashboard
    expect(screen.getByText(/StackZen Dashboard/i)).toBeInTheDocument();
  });

  it('has correct links and buttons', () => {
    render(<HeroSection />);

    // Check register link
    const registerLink = screen.getByText(/Start For Free/i).closest('a');
    expect(registerLink).toHaveAttribute('href', '/register');

    // Check demo button
    const demoButton = screen.getByText(/Watch Demo/i).closest('button');
    expect(demoButton).toBeInTheDocument();
  });

  it('renders with correct styling classes', () => {
    render(<HeroSection />);

    // Check main section classes
    const section = screen.getByRole('region');
    expect(section).toHaveClass('relative', 'flex', 'flex-col', 'md:flex-row');

    // Check heading classes
    const heading = screen.getByRole('heading');
    expect(heading).toHaveClass('font-heading', 'font-semibold', 'text-heading-xl', 'mb-6');

    // Check CTA button classes
    const ctaButton = screen.getByText(/Start For Free/i).closest('a');
    expect(ctaButton).toHaveClass('px-7', 'py-3.5', 'text-base', 'font-semibold');
  });
});
