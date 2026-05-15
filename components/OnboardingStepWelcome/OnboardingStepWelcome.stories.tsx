import React from 'react';
import { Meta, Story } from '@storybook/react';
import OnboardingStepWelcome from './index.tsx';

export default {
  title: 'Onboarding/OnboardingStepWelcome',
  component: OnboardingStepWelcome,
} as Meta;

const Template: Story<{ onNext: () => void }> = args => <OnboardingStepWelcome {...args} />;

export const Default = Template.bind({});
Default.args = {
  onNext: () => console.log('Next step clicked'),
};
