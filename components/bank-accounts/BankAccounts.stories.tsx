import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import BankAccounts from './index.tsx';

const meta: Meta<typeof BankAccounts> = {
  title: 'Core/BankAccounts',
  component: BankAccounts,
};
export default meta;

type Story = StoryObj<typeof BankAccounts>;

export const Default: Story = {
  render: () => <BankAccounts />,
};
