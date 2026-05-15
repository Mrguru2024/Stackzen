import type { Meta, StoryObj } from '@storybook/react';
import SmartIncomeIntelligencePanel from '@/components/operational-workspace/SmartIncomeIntelligencePanel';

const meta: Meta<typeof SmartIncomeIntelligencePanel> = {
  title: 'Operational workspace/SmartIncomeIntelligencePanel',
  component: SmartIncomeIntelligencePanel,
};

export default meta;

type Story = StoryObj<typeof SmartIncomeIntelligencePanel>;

export const Default: Story = {
  render: () => <SmartIncomeIntelligencePanel />,
};
