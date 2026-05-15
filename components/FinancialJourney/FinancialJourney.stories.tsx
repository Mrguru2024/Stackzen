import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import FinancialJourney from './index.tsx';

const meta: Meta<typeof FinancialJourney> = {
  title: 'Components/FinancialJourney',
  component: FinancialJourney,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof FinancialJourney>;

export const Default: Story = {
  args: {
    userId: 'test-user-123',
  },
};

export const Loading: Story = {
  args: {
    userId: 'test-user-123',
  },
  parameters: {
    mockData: [
      {
        url: '/api/financial-journey/*',
        method: 'GET',
        status: 200,
        delay: 2000,
        response: {
          milestones: [],
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
        url: '/api/financial-journey/*',
        method: 'GET',
        status: 500,
        response: {
          error: 'Failed to load financial journey data',
        },
      },
    ],
  },
};
