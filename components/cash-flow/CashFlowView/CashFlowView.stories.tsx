import type { Meta, StoryObj } from '@storybook/react';
import CashFlowView from './index';

const meta: Meta<typeof CashFlowView> = {
  title: 'Finance/Cash Flow view',
  component: CashFlowView,
  parameters: {
    layout: 'padded',
    nextjs: {
      appDirectory: true,
    },
  },
};
export default meta;

type Story = StoryObj<typeof CashFlowView>;

export const Default: Story = {
  render: () => <CashFlowView />,
};
