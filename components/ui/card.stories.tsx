import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Card } from './card';

const meta: Meta<typeof Card> = {
  title: 'UI/Card',
  component: Card,
};
export default meta;

type Story = StoryObj<typeof Card>;

export const Default: Story = {
  render: () => (
    <Card>
      <div className="p-4">Default Card Content</div>
    </Card>
  ),
};

export const WithCustomContent: Story = {
  render: () => (
    <Card>
      <div className="p-4">
        <h3 className="mb-2 font-bold">Card Title</h3>
        <p>This is a card with custom content.</p>
      </div>
    </Card>
  ),
};
