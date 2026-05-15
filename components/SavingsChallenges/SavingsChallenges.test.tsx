import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SavingsChallenges from './index.tsx';
import { useSavingsChallenges } from '@/hooks/useSavingsChallenges';

// Mock the useSavingsChallenges hook
jest.mock('@/hooks/useSavingsChallenges');

const _mockChallenges = [
  {
    id: '1',
    title: 'Emergency Fund Challenge',
    description: 'Build a 6-month emergency fund',
    targetAmount: 15000,
    currentAmount: 5000,
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-06-30'),
    participants: 45,
    type: 'personal',
    category: 'emergency',
    status: 'active',
  },
  {
    id: '2',
    title: 'Summer Vacation Fund',
    description: 'Save for your dream summer vacation',
    targetAmount: 5000,
    currentAmount: 2000,
    startDate: new Date('2024-03-01'),
    endDate: new Date('2024-07-31'),
    participants: 78,
    type: 'group',
    category: 'vacation',
    status: 'active',
  },
];

describe('SavingsChallenges', () => {
  beforeEach(() => {
    (useSavingsChallenges as jest.Mock).mockReturnValue({
      challenges: _mockChallenges,
      loading: false,
      error: null,
      createChallenge: jest.fn(),
      updateProgress: jest.fn(),
      joinChallenge: jest.fn(),
    });
  });

  it('renders the challenges list', () => {
    render(<SavingsChallenges />);

    expect(screen.getByText('Savings Challenges')).toBeInTheDocument();
    expect(screen.getByText('Emergency Fund Challenge')).toBeInTheDocument();
    expect(screen.getByText('Summer Vacation Fund')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    (useSavingsChallenges as jest.Mock).mockReturnValue({
      challenges: [],
      loading: true,
      error: null,
      createChallenge: jest.fn(),
      updateProgress: jest.fn(),
      joinChallenge: jest.fn(),
    });

    render(<SavingsChallenges />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('shows error state', () => {
    (useSavingsChallenges as jest.Mock).mockReturnValue({
      challenges: [],
      loading: false,
      error: 'Failed to fetch challenges',
      createChallenge: jest.fn(),
      updateProgress: jest.fn(),
      joinChallenge: jest.fn(),
    });

    render(<SavingsChallenges />);
    expect(screen.getByText('Error: Failed to fetch challenges')).toBeInTheDocument();
  });

  it('opens create challenge modal', () => {
    render(<SavingsChallenges />);

    fireEvent.click(screen.getByText('New Challenge'));

    expect(screen.getByText('Create New Challenge')).toBeInTheDocument();
    expect(screen.getByLabelText('Title')).toBeInTheDocument();
    expect(screen.getByLabelText('Description')).toBeInTheDocument();
    expect(screen.getByLabelText('Target Amount')).toBeInTheDocument();
  });

  it('creates a new challenge', async () => {
    const _mockCreateChallenge = jest.fn().mockResolvedValue(true);
    (useSavingsChallenges as jest.Mock).mockReturnValue({
      challenges: _mockChallenges,
      loading: false,
      error: null,
      createChallenge: _mockCreateChallenge,
      updateProgress: jest.fn(),
      joinChallenge: jest.fn(),
    });

    render(<SavingsChallenges />);

    fireEvent.click(screen.getByText('New Challenge'));

    fireEvent.change(screen.getByLabelText('Title'), {
      target: { value: 'New Challenge' },
    });
    fireEvent.change(screen.getByLabelText('Description'), {
      target: { value: 'Test description' },
    });
    fireEvent.change(screen.getByLabelText('Target Amount'), {
      target: { value: '1000' },
    });
    fireEvent.change(screen.getByLabelText('Start Date'), {
      target: { value: '2024-01-01' },
    });
    fireEvent.change(screen.getByLabelText('End Date'), {
      target: { value: '2024-12-31' },
    });

    fireEvent.click(screen.getByText('Create Challenge'));

    await waitFor(() => {
      expect(_mockCreateChallenge).toHaveBeenCalledWith({
        title: 'New Challenge',
        description: 'Test description',
        targetAmount: 1000,
        startDate: expect.any(Date),
        endDate: expect.any(Date),
        type: 'personal',
        category: 'other',
      });
    });
  });

  it('updates challenge progress', async () => {
    const _mockUpdateProgress = jest.fn();
    (useSavingsChallenges as jest.Mock).mockReturnValue({
      challenges: _mockChallenges,
      loading: false,
      error: null,
      createChallenge: jest.fn(),
      updateProgress: _mockUpdateProgress,
      joinChallenge: jest.fn(),
    });

    render(<SavingsChallenges />);

    const _updateButtons = screen.getAllByText('Update Progress');
    fireEvent.click(_updateButtons[0]);

    await waitFor(() => {
      expect(_mockUpdateProgress).toHaveBeenCalledWith('1', 5100);
    });
  });

  it('joins a group challenge', async () => {
    const _mockJoinChallenge = jest.fn();
    (useSavingsChallenges as jest.Mock).mockReturnValue({
      challenges: _mockChallenges,
      loading: false,
      error: null,
      createChallenge: jest.fn(),
      updateProgress: jest.fn(),
      joinChallenge: _mockJoinChallenge,
    });

    render(<SavingsChallenges />);

    const _joinButtons = screen.getAllByText('Join Challenge');
    fireEvent.click(_joinButtons[0]);

    await waitFor(() => {
      expect(_mockJoinChallenge).toHaveBeenCalledWith('2');
    });
  });
});
