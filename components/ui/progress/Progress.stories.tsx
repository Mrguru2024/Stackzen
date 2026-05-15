// import React from 'react'; // Unused
import { Meta, StoryObj } from '@storybook/react';
import Progress from './index';

const meta: Meta<typeof Progress> = {
  title: 'UI/Progress',
  component: Progress,
  argTypes: {
    value: {
      control: { type: 'range', min: 0, max: 100, step: 1 },
    },
  },
};

export default meta;

type Story = StoryObj<typeof Progress>;

export const Default: Story = {
  args: {
    value: 0,
  },
};

export const HalfProgress: Story = {
  args: {
    value: 50,
  },
};

export const FullProgress: Story = {
  args: {
    value: 100,
  },
};
