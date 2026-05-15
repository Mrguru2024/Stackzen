import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import StackZenGigsManager from './index.tsx';
import * as hooks from '@/lib/hooks/useStackZenGigs';

jest.mock('@/lib/hooks/useStackZenGigs');

const mockGigs = [
  {
    id: '1',
    title: 'Test Gig',
    description: 'Test desc',
    category: 'dev',
    duration: '1 week',
    budget: 100,
    rating: 4.5,
    postedBy: 'Admin',
    skills: ['React'],
    isProOnly: false,
    createdAt: '',
    updatedAt: '',
  },
];

describe('StackZenGigsManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    hooks.useStackZenGigs.mockReturnValue({ data: mockGigs, isLoading: false });
    hooks.useCreateStackZenGig.mockReturnValue({ mutate: jest.fn() });
    hooks.useUpdateStackZenGig.mockReturnValue({ mutate: jest.fn() });
    hooks.useDeleteStackZenGig.mockReturnValue({ mutate: jest.fn() });
  });

  it('renders gig list', () => {
    render(<StackZenGigsManager />);
    expect(screen.getByText('Test Gig')).toBeInTheDocument();
    expect(screen.getByText('dev')).toBeInTheDocument();
  });

  it('opens modal to create a new gig', () => {
    render(<StackZenGigsManager />);
    fireEvent.click(screen.getByText('New Gig'));
    expect(screen.getByText('New Gig')).toBeInTheDocument();
    expect(screen.getByLabelText('Title')).toBeInTheDocument();
  });

  it('opens modal to edit a gig', () => {
    render(<StackZenGigsManager />);
    fireEvent.click(screen.getByText('Edit'));
    expect(screen.getByText('Edit Gig')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Gig')).toBeInTheDocument();
  });

  it('calls delete on delete button click', () => {
    const deleteMock = jest.fn();
    hooks.useDeleteStackZenGig.mockReturnValue({ mutate: deleteMock });
    render(<StackZenGigsManager />);
    fireEvent.click(screen.getByText('Delete'));
    expect(deleteMock).toHaveBeenCalledWith('1');
  });
});
