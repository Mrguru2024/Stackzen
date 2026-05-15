import React from 'react';
import { Meta, Story } from '@storybook/react';
import OnboardingStepSetupGoals from './index.tsx';

export default {
  title: 'Onboarding/OnboardingStepSetupGoals',
  component: OnboardingStepSetupGoals,
} as Meta;

const Template: Story<{ onNext: (goals: string[]) => void }> = args => (
  <OnboardingStepSetupGoals {...args} />
);

export const Default = Template.bind({});
Default.args = {
  onNext: goals => console.log('Goals submitted:', goals),
};
