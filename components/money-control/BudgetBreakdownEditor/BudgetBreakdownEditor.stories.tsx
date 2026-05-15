import type { Meta, StoryObj } from '@storybook/react';
import BudgetBreakdownEditor from './index';

const meta: Meta<typeof BudgetBreakdownEditor> = {
  title: 'MoneyControl/BudgetBreakdownEditor',
  component: BudgetBreakdownEditor,
};

export default meta;

type Story = StoryObj<typeof BudgetBreakdownEditor>;

export const Default: Story = {
  args: {},
};
