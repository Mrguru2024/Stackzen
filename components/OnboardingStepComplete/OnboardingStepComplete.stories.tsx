import React from 'react';
import { Meta, Story } from '@storybook/react';
import OnboardingStepComplete from './index.tsx';

export default {
  title: 'Onboarding/OnboardingStepComplete',
  component: OnboardingStepComplete,
} as Meta;

const Template: Story<{ onFinish: () => void }> = args => <OnboardingStepComplete {...args} />;

export const Default = Template.bind({});
Default.args = {
  onFinish: () => console.log('Onboarding finished'),
};
