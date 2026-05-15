import React from 'react';
import { Meta, Story } from '@storybook/react';
import OnboardingStepSetupAllocation from './index.tsx';

export default {
  title: 'Onboarding/OnboardingStepSetupAllocation',
  component: OnboardingStepSetupAllocation,
} as Meta;

const Template: Story<{
  onNext: (allocation: { needs: number; wants: number; savings: number }) => void;
}> = args => <OnboardingStepSetupAllocation {...args} />;

export const Default = Template.bind({});
Default.args = {
  onNext: allocation => console.log('Allocation submitted:', allocation),
};
