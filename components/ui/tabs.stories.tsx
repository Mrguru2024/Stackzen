import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Tabs } from './tabs';

const meta: Meta<typeof Tabs> = {
  title: 'UI/Tabs',
  component: Tabs,
};
export default meta;

type Story = StoryObj<typeof Tabs>;

export const TwoTabs: Story = {
  render: () => (
    <Tabs
      tabs={[
        { label: 'Tab 1', content: <div className="p-4">Content 1</div> },
        { label: 'Tab 2', content: <div className="p-4">Content 2</div> },
      ]}
    />
  ),
};
