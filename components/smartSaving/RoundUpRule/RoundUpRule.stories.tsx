import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import RoundUpRule from './index';

const meta: Meta<typeof RoundUpRule> = {
  title: 'SmartSaving/RoundUpRule',
  component: RoundUpRule,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    onUpdate: { action: 'updated' },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const Enabled: Story = {
  args: {},
  parameters: {
    mockData: [
      {
        url: '/api/smart-saving/rules',
        method: 'GET',
        status: 200,
        response: [
          {
            type: 'roundup',
            config: { enabled: true, maxAmount: 5 },
          },
        ],
      },
      {
        url: '/api/smart-saving/summary',
        method: 'GET',
        status: 200,
        response: {
          weeklySummary: {
            ruleBreakdown: { roundup: 25.75 },
          },
        },
      },
    ],
  },
};

export const Disabled: Story = {
  args: {},
  parameters: {
    mockData: [
      {
        url: '/api/smart-saving/rules',
        method: 'GET',
        status: 200,
        response: [
          {
            type: 'roundup',
            config: { enabled: false, maxAmount: 5 },
          },
        ],
      },
    ],
  },
};

export const Loading: Story = {
  args: {},
  parameters: {
    mockData: [
      {
        url: '/api/smart-saving/rules',
        method: 'GET',
        status: 200,
        response: [],
        delay: 2000,
      },
    ],
  },
};
