import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import FinancialMentorship from './index.tsx';

const meta: Meta<typeof FinancialMentorship> = {
  title: 'Components/FinancialMentorship',
  component: FinancialMentorship,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof FinancialMentorship>;

const mockMentors = [
  {
    id: 'mentor-1',
    name: 'Sarah Johnson',
    specialization: 'Investment Strategy & Portfolio Management',
    avatar: '/avatars/mentor-1.jpg',
    rating: 4.9,
    sessionsCompleted: 245,
    studentsHelped: 89,
    bio: 'Certified Financial Planner with 15 years of experience.',
    expertise: ['Investment Strategy', 'Retirement Planning'],
  },
  {
    id: 'mentor-2',
    name: 'Michael Chen',
    specialization: 'Debt Management & Credit Optimization',
    avatar: '/avatars/mentor-2.jpg',
    rating: 4.8,
    sessionsCompleted: 189,
    studentsHelped: 67,
    bio: 'Former credit analyst turned financial coach.',
    expertise: ['Debt Management', 'Credit Score Optimization'],
  },
];

export const Default: Story = {
  args: {
    userId: 'test-user-123',
  },
  parameters: {
    mockData: [
      {
        url: '/api/financial-mentorship',
        method: 'GET',
        status: 200,
        response: {
          mentors: mockMentors,
          availableTimeSlots: ['09:00 AM', '10:00 AM', '11:00 AM'],
          upcomingSessions: [],
        },
      },
    ],
  },
};

export const Loading: Story = {
  args: {
    userId: 'test-user-123',
  },
  parameters: {
    mockData: [
      {
        url: '/api/financial-mentorship',
        method: 'GET',
        status: 200,
        delay: 2000,
        response: {
          mentors: [],
          availableTimeSlots: [],
          upcomingSessions: [],
        },
      },
    ],
  },
};

export const Error: Story = {
  args: {
    userId: 'test-user-123',
  },
  parameters: {
    mockData: [
      {
        url: '/api/financial-mentorship',
        method: 'GET',
        status: 500,
        response: {
          error: 'Failed to load mentorship data',
        },
      },
    ],
  },
};

export const WithUpcomingSessions: Story = {
  args: {
    userId: 'test-user-123',
  },
  parameters: {
    mockData: [
      {
        url: '/api/financial-mentorship',
        method: 'GET',
        status: 200,
        response: {
          mentors: mockMentors,
          availableTimeSlots: ['09:00 AM', '10:00 AM', '11:00 AM'],
          upcomingSessions: [
            {
              id: 'session-1',
              mentorId: 'mentor-1',
              date: '2024-03-20',
              time: '10:00 AM',
              status: 'scheduled',
            },
          ],
        },
      },
    ],
  },
};
