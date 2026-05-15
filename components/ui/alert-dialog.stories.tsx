import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { AlertDialog } from './alert-dialog';

const meta: Meta<typeof AlertDialog> = {
  title: 'UI/AlertDialog',
  component: AlertDialog,
};
export default meta;

type Story = StoryObj<typeof AlertDialog>;

export const Basic: Story = {
  render: () => (
    <AlertDialog trigger={<button className="btn">Open Dialog</button>}>
      <div className="p-4">Dialog Content</div>
    </AlertDialog>
  ),
};
