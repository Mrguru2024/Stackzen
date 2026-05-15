import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import OnboardingDataCard from './index.tsx';

const meta: Meta<typeof OnboardingDataCard> = {
  title: 'Components/OnboardingDataCard',
  component: OnboardingDataCard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof OnboardingDataCard>;

const defaultData = {
  income: 5000,
  allocation: {
    needs: 50,
    wants: 30,
    savings: 20,
  },
  goals: ['Save for emergency fund', 'Pay off credit card debt'],
  bankConnected: true,
};

export const Default: Story = {
  args: {
    data: defaultData,
  },
};

export const NoGoals: Story = {
  args: {
    data: {
      ...defaultData,
      goals: [],
    },
  },
};

export const BankNotConnected: Story = {
  args: {
    data: {
      ...defaultData,
      bankConnected: false,
    },
  },
};

export const HighIncome: Story = {
  args: {
    data: {
      ...defaultData,
      income: 10000,
    },
  },
};

export const ConservativeAllocation: Story = {
  args: {
    data: {
      ...defaultData,
      allocation: {
        needs: 60,
        wants: 20,
        savings: 20,
      },
    },
  },
};
