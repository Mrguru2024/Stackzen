import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import SavingsChallenges from './index.tsx';
// import { useSavingsChallenges } from '@/hooks/useSavingsChallenges';

// Mock the useSavingsChallenges hook
jest.mock('@/hooks/useSavingsChallenges');

const meta: Meta<typeof SavingsChallenges> = {
  title: 'Components/SavingsChallenges',
  component: SavingsChallenges,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof SavingsChallenges>;

const mockChallenges = [
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
  {
    id: '3',
    title: 'Education Savings',
    description: 'Save for future education expenses',
    targetAmount: 10000,
    currentAmount: 7500,
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-12-31'),
    participants: 32,
    type: 'personal',
    category: 'education',
    status: 'active',
  },
];

export const Default: Story = {
  parameters: {
    mockData: {
      challenges: mockChallenges,
      loading: false,
      error: null,
    },
  },
};

export const Loading: Story = {
  parameters: {
    mockData: {
      challenges: [],
      loading: true,
      error: null,
    },
  },
};

export const Error: Story = {
  parameters: {
    mockData: {
      challenges: [],
      loading: false,
      error: 'Failed to fetch challenges',
    },
  },
};

export const Empty: Story = {
  parameters: {
    mockData: {
      challenges: [],
      loading: false,
      error: null,
    },
  },
};

export const WithLongList: Story = {
  parameters: {
    mockData: {
      challenges: [
        ...mockChallenges,
        {
          id: '4',
          title: 'Home Down Payment',
          description: 'Save for a house down payment',
          targetAmount: 50000,
          currentAmount: 15000,
          startDate: new Date('2024-01-01'),
          endDate: new Date('2025-12-31'),
          participants: 120,
          type: 'group',
          category: 'home',
          status: 'active',
        },
        {
          id: '5',
          title: 'Car Fund',
          description: 'Save for a new car',
          targetAmount: 25000,
          currentAmount: 8000,
          startDate: new Date('2024-02-01'),
          endDate: new Date('2024-12-31'),
          participants: 65,
          type: 'personal',
          category: 'other',
          status: 'active',
        },
      ],
      loading: false,
      error: null,
    },
  },
};

export const WithCompletedChallenges: Story = {
  parameters: {
    mockData: {
      challenges: [
        {
          ...mockChallenges[0],
          currentAmount: 15000,
          status: 'completed',
        },
        {
          ...mockChallenges[1],
          currentAmount: 5000,
          status: 'completed',
        },
        ...mockChallenges.slice(2),
      ],
      loading: false,
      error: null,
    },
  },
};
