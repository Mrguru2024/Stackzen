import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import GrantsComingSoon from './index';

const meta: Meta<typeof GrantsComingSoon> = {
  title: 'Income/GrantsComingSoon',
  component: GrantsComingSoon,
};
export default meta;

type Story = StoryObj<typeof GrantsComingSoon>;

export const Default: Story = {
  render: () => <GrantsComingSoon />,
};
