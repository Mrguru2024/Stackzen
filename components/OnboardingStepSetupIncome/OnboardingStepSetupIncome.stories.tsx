import React from 'react';
import { Meta, Story } from '@storybook/react';
import OnboardingStepSetupIncome from './index.tsx';

export default {
  title: 'Onboarding/OnboardingStepSetupIncome',
  component: OnboardingStepSetupIncome,
} as Meta;

const Template: Story<{ onNext: (income: number) => void }> = args => (
  <OnboardingStepSetupIncome {...args} />
);

export const Default = Template.bind({});
Default.args = {
  onNext: income => console.log('Income submitted:', income),
};
