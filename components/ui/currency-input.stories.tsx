import React from 'react';
import { CurrencyInput } from './currency-input';

const story = {
  title: 'UI/CurrencyInput',
  component: CurrencyInput,
};

const Template = args => {
  const [value, setValue] = React.useState(args.value || '');
  return <CurrencyInput {...args} value={value} onChange={setValue} />;
};

export const Default = Template.bind({});
Default.args = {
  value: '0.00',
  currency: 'USD',
};

export const WithPrefix = Template.bind({});
WithPrefix.args = {
  value: '0.00',
  currency: 'USD',
  showPrefix: true,
};

export const WithSuffix = Template.bind({});
WithSuffix.args = {
  value: '0.00',
  currency: 'USD',
  showSuffix: true,
};

export default story;
