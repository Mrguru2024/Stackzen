import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Switch } from './switch';

const meta: Meta<typeof Switch> = {
  title: 'UI/Switch',
  component: Switch,
};
export default meta;

type Story = StoryObj<typeof Switch>;

const CheckedSwitch = () => {
  const [checked, setChecked] = useState(true);
  return <Switch checked={checked} onCheckedChange={setChecked} />;
};

const UncheckedSwitch = () => {
  const [checked, setChecked] = useState(false);
  return <Switch checked={checked} onCheckedChange={setChecked} />;
};

export const Checked: Story = {
  render: () => <CheckedSwitch />,
};

export const Unchecked: Story = {
  render: () => <UncheckedSwitch />,
};
