import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { MoneyMentor } from './index.tsx';

const meta: Meta<typeof MoneyMentor> = {
  title: 'Components/MoneyMentor',
  component: MoneyMentor,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof MoneyMentor>;

const mockMessages = [
  {
    id: '1',
    content: 'Hello',
    role: 'user' as const,
    timestamp: new Date(),
  },
  {
    id: '2',
    content: 'Hi! How can I help you today?',
    role: 'assistant' as const,
    timestamp: new Date(),
  },
];

export const Default: Story = {
  parameters: {
    mockData: [
      {
        url: '/api/money-mentor/history',
        method: 'GET',
        status: 200,
        response: {
          messages: mockMessages,
          context: {},
        },
      },
    ],
  },
};

export const Loading: Story = {
  parameters: {
    mockData: [
      {
        url: '/api/money-mentor/history',
        method: 'GET',
        status: 200,
        delay: 2000,
        response: {
          messages: [],
          context: {},
        },
      },
    ],
  },
};

export const Error: Story = {
  parameters: {
    mockData: [
      {
        url: '/api/money-mentor/history',
        method: 'GET',
        status: 500,
        response: {
          error: 'Failed to load chat history',
        },
      },
    ],
  },
};

export const WithLongConversation: Story = {
  parameters: {
    mockData: [
      {
        url: '/api/money-mentor/history',
        method: 'GET',
        status: 200,
        response: {
          messages: [
            ...mockMessages,
            {
              id: '3',
              content: 'I need help with my investment strategy',
              role: 'user' as const,
              timestamp: new Date(),
            },
            {
              id: '4',
              content:
                "I'd be happy to help you with your investment strategy. Could you tell me more about your current portfolio and investment goals?",
              role: 'assistant' as const,
              timestamp: new Date(),
            },
            {
              id: '5',
              content: "I have about $50,000 to invest and I'm looking for long-term growth",
              role: 'user' as const,
              timestamp: new Date(),
            },
            {
              id: '6',
              content:
                "That's a great starting point! For long-term growth, we should consider a diversified portfolio. Would you like to discuss specific investment options and risk tolerance?",
              role: 'assistant' as const,
              timestamp: new Date(),
            },
          ],
          context: {
            financialGoals: ['Long-term growth'],
            riskTolerance: 'medium',
          },
        },
      },
    ],
  },
};
