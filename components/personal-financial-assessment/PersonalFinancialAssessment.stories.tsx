import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import PersonalFinancialAssessment from './index.tsx';

const meta: Meta<typeof PersonalFinancialAssessment> = {
  title: 'Core/PersonalFinancialAssessment',
  component: PersonalFinancialAssessment,
};
export default meta;

type Story = StoryObj<typeof PersonalFinancialAssessment>;

export const Default: Story = {
  render: () => <PersonalFinancialAssessment />,
};
