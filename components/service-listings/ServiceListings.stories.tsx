import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import ServiceListings from './index.tsx';

const meta: Meta<typeof ServiceListings> = {
  title: 'Core/ServiceListings',
  component: ServiceListings,
};
export default meta;

type Story = StoryObj<typeof ServiceListings>;

export const Default: Story = {
  render: () => <ServiceListings />,
};
