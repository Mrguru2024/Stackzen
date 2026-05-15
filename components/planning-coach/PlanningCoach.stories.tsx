import React from 'react';
import PlanningCoach from './index.tsx';

const Template = (args: any) => <PlanningCoach {...args} />;

export const Default = Template.bind({});
Default.args = {
  income: 5000,
  expenses: 3000,
  timeOffDays: 5,
};

export const CustomScenario = Template.bind({});
CustomScenario.args = {
  income: 8000,
  expenses: 4500,
  timeOffDays: 10,
};

const stories = {
  // ... story definitions ...
};
export default stories;
