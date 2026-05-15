import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Checkbox } from './index.tsx';

const meta: Meta<typeof Checkbox> = {
  title: 'UI/Checkbox',
  component: Checkbox,
  tags: ['autodocs'],
  argTypes: {
    checked: {
      control: 'boolean',
      description: 'The checked state of the checkbox',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the checkbox is disabled',
    },
    onCheckedChange: {
      action: 'checked',
      description: 'Event handler called when the checked state changes',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Checkbox>;

export const Default: Story = {
  args: {},
};

export const Checked: Story = {
  args: {
    checked: true,
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};

export const DisabledChecked: Story = {
  args: {
    disabled: true,
    checked: true,
  },
};

export const WithLabel: Story = {
  render: args => (
    <div className="flex items-center space-x-2">
      <Checkbox {...args} id="terms" />
      <label
        htmlFor="terms"
        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
      >
        Accept terms and conditions
      </label>
    </div>
  ),
};

// New stories
export const WithDescription: Story = {
  render: args => (
    <div className="grid gap-1.5 leading-none">
      <div className="flex items-center space-x-2">
        <Checkbox {...args} id="newsletter" />
        <label
          htmlFor="newsletter"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Subscribe to newsletter
        </label>
      </div>
      <p className="text-sm text-muted-foreground">
        Receive updates about new features and improvements.
      </p>
    </div>
  ),
};

export const WithError: Story = {
  render: args => (
    <div className="grid gap-1.5 leading-none">
      <div className="flex items-center space-x-2">
        <Checkbox {...args} id="error-checkbox" />
        <label
          htmlFor="error-checkbox"
          className="text-sm font-medium leading-none text-destructive"
        >
          Required field
        </label>
      </div>
      <p className="text-sm text-destructive">This field is required</p>
    </div>
  ),
};

export const WithCustomSize: Story = {
  render: args => (
    <div className="flex items-center space-x-2">
      <Checkbox {...args} className="h-6 w-6" />
      <label className="text-lg">Large checkbox</label>
    </div>
  ),
};

export const WithCustomColors: Story = {
  render: args => (
    <div className="flex items-center space-x-2">
      <Checkbox {...args} className="border-primary text-primary" />
      <label>Custom colored checkbox</label>
    </div>
  ),
};

export const WithIndeterminate: Story = {
  render: args => (
    <div className="flex items-center space-x-2">
      <Checkbox {...args} id="indeterminate" />
      <label htmlFor="indeterminate">Indeterminate state</label>
    </div>
  ),
  args: {
    'aria-checked': 'mixed',
  },
};
