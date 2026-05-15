import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SessionProvider } from 'next-auth/react';
import GigApplicationList from './index.tsx';

// Mock next-auth
jest.mock('next-auth/react', () => ({
  useSession: () => ({
    data: {
      user: { id: '1', name: 'Test User', email: 'test@example.com' },
    },
    status: 'authenticated',
  }),
  SessionProvider: ({ children }: { children: React.ReactNode }) => children,
}));

const _mockApplications = [
  {
    id: '1',
    coverLetter: 'Test cover letter',
    proposedBudget: 1000,
    estimatedDuration: '2 weeks',
    status: 'PENDING',
    createdAt: new Date().toISOString(),
    user: {
      name: 'Test User',
      email: 'test@example.com',
      image: '/test-avatar.png',
    },
  },
];

const _mockOnStatusChange = jest.fn();

describe('GigApplicationList', () => {
  const _renderComponent = (props = {}) => {
    return render(
      <SessionProvider
        session={{
          user: { id: '1', name: 'Test User', email: 'test@example.com' },
          expires: '1',
        }}
      >
        <GigApplicationList
          gigId="1"
          applications={_mockApplications}
          onStatusChange={_mockOnStatusChange}
          {...props}
        />
      </SessionProvider>
    );
  };

  beforeEach(() => {
    _mockOnStatusChange.mockClear();
  });

  it('renders empty state when no applications', () => {
    _renderComponent({ applications: [] });
    expect(screen.getByText('No applications yet')).toBeInTheDocument();
  });

  it('renders application details correctly', () => {
    _renderComponent();
    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
    expect(screen.getByText('Test cover letter')).toBeInTheDocument();
    expect(screen.getByText('$1000')).toBeInTheDocument();
    expect(screen.getByText('2 weeks')).toBeInTheDocument();
  });

  it('shows accept and reject buttons for pending applications', () => {
    _renderComponent();
    expect(screen.getByText('Accept')).toBeInTheDocument();
    expect(screen.getByText('Reject')).toBeInTheDocument();
  });

  it('calls onStatusChange when accept button is clicked', async () => {
    _renderComponent();
    fireEvent.click(screen.getByText('Accept'));
    await waitFor(() => {
      expect(_mockOnStatusChange).toHaveBeenCalledWith('1', 'ACCEPTED');
    });
  });

  it('calls onStatusChange when reject button is clicked', async () => {
    _renderComponent();
    fireEvent.click(screen.getByText('Reject'));
    await waitFor(() => {
      expect(_mockOnStatusChange).toHaveBeenCalledWith('1', 'REJECTED');
    });
  });

  it('disables buttons while loading', async () => {
    _renderComponent();
    fireEvent.click(screen.getByText('Accept'));
    expect(screen.getByText('Updating...')).toBeInTheDocument();
    expect(screen.getByText('Accept')).toBeDisabled();
    expect(screen.getByText('Reject')).toBeDisabled();
  });

  it('shows correct status badge color', () => {
    const applications = [
      { ..._mockApplications[0], status: 'ACCEPTED' },
      { ..._mockApplications[0], id: '2', status: 'REJECTED' },
      { ..._mockApplications[0], id: '3', status: 'PENDING' },
    ];

    _renderComponent({ applications: applications });

    const _badges = screen.getAllByRole('status');
    expect(_badges[0]).toHaveClass('bg-green-100');
    expect(_badges[1]).toHaveClass('bg-red-100');
    expect(_badges[2]).toHaveClass('bg-yellow-100');
  });
});
