import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import InternalApplicationsManager from './InternalApplicationsManager.tsx';
import { useGigApplications } from '@/lib/hooks/useGigApplications';

// Mock the useGigApplications hook
jest.mock('@/lib/hooks/useGigApplications');

const mockApplications = [
  {
    id: '1',
    gigId: '1',
    userId: '1',
    status: 'pending',
    data: {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '1234567890',
      portfolio: 'https://portfolio.com',
      coverLetter: 'I am interested in this position',
      experience: '5 years of experience',
      availability: 'Immediate',
      rate: '$50/hour',
      additionalInfo: 'Additional details',
    },
    createdAt: '2024-03-27T00:00:00.000Z',
    updatedAt: '2024-03-27T00:00:00.000Z',
    gig: {
      title: 'Frontend Developer',
    },
    user: {
      name: 'John Doe',
      email: 'john@example.com',
    },
  },
];

describe('InternalApplicationsManager', () => {
  const queryClient = new QueryClient();

  beforeEach(() => {
    (useGigApplications as jest.Mock).mockReturnValue({
      applications: mockApplications,
      isLoading: false,
      updateStatus: jest.fn(),
    });
  });

  it('renders loading state', () => {
    (useGigApplications as jest.Mock).mockReturnValue({
      applications: [],
      isLoading: true,
      updateStatus: jest.fn(),
    });

    render(
      <QueryClientProvider client={queryClient}>
        <InternalApplicationsManager />
      </QueryClientProvider>
    );

    expect(screen.getByText('Loading applications...')).toBeInTheDocument();
  });

  it('renders applications list', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <InternalApplicationsManager />
      </QueryClientProvider>
    );

    expect(screen.getByText('Internal Applications')).toBeInTheDocument();
    expect(screen.getByText('Frontend Developer')).toBeInTheDocument();
    expect(screen.getByText('Applied by John Doe (john@example.com)')).toBeInTheDocument();
  });

  it('opens application details modal', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <InternalApplicationsManager />
      </QueryClientProvider>
    );

    fireEvent.click(screen.getByText('View Details'));

    await waitFor(() => {
      expect(screen.getByText('Application Details')).toBeInTheDocument();
      expect(screen.getByText('Name: John Doe')).toBeInTheDocument();
      expect(screen.getByText('Email: john@example.com')).toBeInTheDocument();
      expect(screen.getByText('Phone: 1234567890')).toBeInTheDocument();
      expect(screen.getByText('Portfolio:')).toBeInTheDocument();
      expect(screen.getByText('Cover Letter')).toBeInTheDocument();
      expect(screen.getByText('Experience')).toBeInTheDocument();
      expect(screen.getByText('Availability')).toBeInTheDocument();
      expect(screen.getByText('Expected Rate')).toBeInTheDocument();
      expect(screen.getByText('Additional Information')).toBeInTheDocument();
    });
  });

  it('updates application status', async () => {
    const updateStatus = jest.fn();
    (useGigApplications as jest.Mock).mockReturnValue({
      applications: mockApplications,
      isLoading: false,
      updateStatus,
    });

    render(
      <QueryClientProvider client={queryClient}>
        <InternalApplicationsManager />
      </QueryClientProvider>
    );

    const select = screen.getByLabelText('Update application status');
    fireEvent.change(select, { target: { value: 'accepted' } });

    expect(updateStatus).toHaveBeenCalledWith({ id: '1', status: 'accepted' });
  });
});
