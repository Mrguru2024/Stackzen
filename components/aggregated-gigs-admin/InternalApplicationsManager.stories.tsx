import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import InternalApplicationsManager from './InternalApplicationsManager.tsx';

const meta: Meta<typeof InternalApplicationsManager> = {
  title: 'Admin/InternalApplicationsManager',
  component: InternalApplicationsManager,
  decorators: [
    Story => {
      const queryClient = new QueryClient();
      return (
        <QueryClientProvider client={queryClient}>
          <Story />
        </QueryClientProvider>
      );
    },
  ],
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof InternalApplicationsManager>;

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
  {
    id: '2',
    gigId: '2',
    userId: '2',
    status: 'accepted',
    data: {
      name: 'Jane Smith',
      email: 'jane@example.com',
      phone: '0987654321',
      portfolio: 'https://jane-portfolio.com',
      coverLetter: 'I would be a great fit for this role',
      experience: '3 years of experience',
      availability: '2 weeks notice',
      rate: '$45/hour',
      additionalInfo: 'Open to relocation',
    },
    createdAt: '2024-03-26T00:00:00.000Z',
    updatedAt: '2024-03-26T00:00:00.000Z',
    gig: {
      title: 'Backend Developer',
    },
    user: {
      name: 'Jane Smith',
      email: 'jane@example.com',
    },
  },
];

export const Loading: Story = {
  parameters: {
    mockData: [
      {
        url: '/api/aggregated-gigs/applications',
        method: 'GET',
        status: 200,
        delay: 2000,
        response: [],
      },
    ],
  },
};

export const WithApplications: Story = {
  parameters: {
    mockData: [
      {
        url: '/api/aggregated-gigs/applications',
        method: 'GET',
        status: 200,
        response: mockApplications,
      },
    ],
  },
};

export const Empty: Story = {
  parameters: {
    mockData: [
      {
        url: '/api/aggregated-gigs/applications',
        method: 'GET',
        status: 200,
        response: [],
      },
    ],
  },
};
