import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import QuoteGenerator from './index.tsx';

const meta: Meta<typeof QuoteGenerator> = {
  title: 'Components/QuoteGenerator',
  component: QuoteGenerator,
};
export default meta;

type Story = StoryObj<typeof QuoteGenerator>;

export const Default: Story = {
  render: () => <QuoteGenerator />,
};
