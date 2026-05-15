import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './button.tsx';

const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
};
export default meta;

type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  render: () => <Button>Primary Button</Button>,
};

export const Secondary: Story = {
  render: () => <Button variant="secondary">Secondary Button</Button>,
};

export const Disabled: Story = {
  render: () => <Button disabled>Disabled Button</Button>,
};
