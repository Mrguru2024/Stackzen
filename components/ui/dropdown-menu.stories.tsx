import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { DropdownMenu } from './dropdown-menu';
import { DropdownMenu } from './dropdown-menu.tsx';

const meta: Meta<typeof DropdownMenu> = {
  title: 'UI/DropdownMenu',
  component: DropdownMenu,
};
export default meta;

type Story = StoryObj<typeof DropdownMenu>;

export const Basic: Story = {
  render: () => (
    <DropdownMenu trigger={<button className="btn">Open Menu</button>}>
      <div className="p-4">Menu Content</div>
    </DropdownMenu>
  ),
};
