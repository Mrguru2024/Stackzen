import type { Meta, StoryObj } from '@storybook/react';
import OperationalFinancialActionPanel from '@/components/operational-workspace/OperationalFinancialActionPanel';

const meta: Meta<typeof OperationalFinancialActionPanel> = {
  title: 'Operational workspace/OperationalFinancialActionPanel',
  component: OperationalFinancialActionPanel,
};

export default meta;

type Story = StoryObj<typeof OperationalFinancialActionPanel>;

export const Default: Story = {
  render: () => <OperationalFinancialActionPanel />,
};
