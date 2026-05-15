import type { Meta, StoryObj } from '@storybook/react';
import ContractorFinancialOperationsPanel from '@/components/operational-workspace/ContractorFinancialOperationsPanel';

const meta: Meta<typeof ContractorFinancialOperationsPanel> = {
  title: 'Operational workspace/ContractorFinancialOperationsPanel',
  component: ContractorFinancialOperationsPanel,
};

export default meta;

type Story = StoryObj<typeof ContractorFinancialOperationsPanel>;

export const Default: Story = {
  render: () => <ContractorFinancialOperationsPanel />,
};
