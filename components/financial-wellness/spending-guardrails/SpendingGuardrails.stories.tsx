import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import SpendingGuardrails from './SpendingGuardrails.tsx';

const meta: Meta<typeof SpendingGuardrails> = {
  title: 'Financial Wellness/Spending Guardrails',
  component: SpendingGuardrails,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof SpendingGuardrails>;

const mockGuardrails = [
  {
    id: '1',
    userId: 'user1',
    category: 'food',
    limit: 500,
    current: 300,
    period: 'monthly',
    notifications: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '2',
    userId: 'user1',
    category: 'entertainment',
    limit: 200,
    current: 180,
    period: 'monthly',
    notifications: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const mockHandlers = {
  onAddGuardrail: () => {},
  onUpdateGuardrail: () => {},
  onDeleteGuardrail: () => {},
  onToggleGuardrail: () => {},
};

export const Default: Story = {
  args: {
    guardrails: mockGuardrails,
    ...mockHandlers,
  },
};

export const Empty: Story = {
  args: {
    guardrails: [],
    ...mockHandlers,
  },
};

export const HighSpending: Story = {
  args: {
    guardrails: [
      {
        ...mockGuardrails[0],
        current: 450, // 90% of limit
      },
      {
        ...mockGuardrails[1],
        current: 210, // Over limit
      },
    ],
    ...mockHandlers,
  },
};

export const MultiplePeriods: Story = {
  args: {
    guardrails: [
      {
        ...mockGuardrails[0],
        period: 'weekly',
        limit: 125,
        current: 75,
      },
      {
        ...mockGuardrails[1],
        period: 'daily',
        limit: 50,
        current: 30,
      },
    ],
    ...mockHandlers,
  },
};
