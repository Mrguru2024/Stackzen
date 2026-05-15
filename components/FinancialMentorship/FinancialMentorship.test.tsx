import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import FinancialMentorship from './index.tsx';
import { useFinancialMentorship } from '@/hooks/useFinancialMentorship';

// Mock the custom hook
jest.mock('@/hooks/useFinancialMentorship');

describe('FinancialMentorship', () => {
  const mockUserId = 'test-user-123';
  const mockMentors = [
    {
      id: 'mentor-1',
      name: 'Sarah Johnson',
      specialization: 'Investment Strategy',
      rating: 4.9,
      sessionsCompleted: 245,
      studentsHelped: 89,
    },
    {
      id: 'mentor-2',
      name: 'Michael Chen',
      specialization: 'Debt Management',
      rating: 4.8,
      sessionsCompleted: 189,
      studentsHelped: 67,
    },
  ];

  const mockData = {
    mentors: mockMentors,
    availableTimeSlots: ['09:00 AM', '10:00 AM', '11:00 AM'],
    upcomingSessions: [],
  };

  beforeEach(() => {
    (useFinancialMentorship as jest.Mock).mockReturnValue({
      data: mockData,
      loading: false,
      error: null,
      bookSession: jest.fn().mockResolvedValue(true),
    });
  });

  it('renders the component with initial state', () => {
    render(<FinancialMentorship userId={mockUserId} />);

    // Check if main heading is rendered
    expect(screen.getByText('Financial Mentorship')).toBeInTheDocument();

    // Check if all mentors are rendered
    expect(screen.getByText('Sarah Johnson')).toBeInTheDocument();
    expect(screen.getByText('Michael Chen')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    (useFinancialMentorship as jest.Mock).mockReturnValue({
      data: null,
      loading: true,
      error: null,
      bookSession: jest.fn(),
    });

    render(<FinancialMentorship userId={mockUserId} />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('shows error state', () => {
    (useFinancialMentorship as jest.Mock).mockReturnValue({
      data: null,
      loading: false,
      error: 'Failed to load data',
      bookSession: jest.fn(),
    });

    render(<FinancialMentorship userId={mockUserId} />);
    expect(screen.getByText('Error loading mentorship data')).toBeInTheDocument();
  });

  it('allows selecting a mentor and booking a session', async () => {
    const mockBookSession = jest.fn().mockResolvedValue(true);
    (useFinancialMentorship as jest.Mock).mockReturnValue({
      data: mockData,
      loading: false,
      error: null,
      bookSession: mockBookSession,
    });

    render(<FinancialMentorship userId={mockUserId} />);

    // Select a mentor
    fireEvent.click(screen.getByText('Sarah Johnson'));

    // Fill in booking details
    const dateInput = screen.getByLabelText('Select Date');
    const timeSelect = screen.getByLabelText('Select Time');

    fireEvent.change(dateInput, { target: { value: '2024-03-20' } });
    fireEvent.change(timeSelect, { target: { value: '10:00 AM' } });

    // Book session
    fireEvent.click(screen.getByText('Book Session'));

    await waitFor(() => {
      expect(mockBookSession).toHaveBeenCalledWith({
        mentorId: 'mentor-1',
        date: '2024-03-20',
        time: '10:00 AM',
      });
    });
  });

  it('disables booking button when required fields are empty', () => {
    render(<FinancialMentorship userId={mockUserId} />);

    // Select a mentor
    fireEvent.click(screen.getByText('Sarah Johnson'));

    // Booking button should be disabled
    const bookButton = screen.getByText('Book Session');
    expect(bookButton).toBeDisabled();
  });
});
