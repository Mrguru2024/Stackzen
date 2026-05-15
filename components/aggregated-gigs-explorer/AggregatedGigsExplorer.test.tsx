import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import AggregatedGigsExplorer from './index.tsx';
import * as hooks from '@/lib/hooks/useAggregatedGigs';

jest.mock('@/lib/hooks/useAggregatedGigs');

const mockGigs = [
  { id: 1, title: 'Freelance Designer', company: 'DesignCo', location: 'Remote' },
  { id: 2, title: 'Web Developer', company: 'WebWorks', location: 'Remote' },
];

describe('AggregatedGigsExplorer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    hooks.useAggregatedGigs.mockReturnValue({ data: mockGigs, isLoading: false });
  });

  it('renders curated gigs', () => {
    render(<AggregatedGigsExplorer />);
    expect(screen.getByText('Remote React Dev')).toBeInTheDocument();
    expect(screen.getByText('Marketing Specialist')).toBeInTheDocument();
  });

  it('filters by category', () => {
    render(<AggregatedGigsExplorer />);
    fireEvent.change(screen.getByLabelText('Filter by category'), { target: { value: 'Web Dev' } });
    expect(screen.getByText('Remote React Dev')).toBeInTheDocument();
    expect(screen.queryByText('Marketing Specialist')).not.toBeInTheDocument();
  });

  it('shows empty state if no gigs', () => {
    hooks.useAggregatedGigs.mockReturnValue({ data: [], isLoading: false });
    render(<AggregatedGigsExplorer />);
    expect(screen.getByText('No gigs found.')).toBeInTheDocument();
  });
});
