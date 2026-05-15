import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import FinancialJourney from './index.tsx';

const meta: Meta<typeof FinancialJourney> = {
  title: 'Core/FinancialJourney',
  component: FinancialJourney,
};
export default meta;

type Story = StoryObj<typeof FinancialJourney>;

export const Default: Story = {
  render: () => <FinancialJourney />,
};
