import type { Meta, StoryObj } from '@storybook/react';
import ReserveAllocationIntelligencePanel from '@/components/operational-workspace/ReserveAllocationIntelligencePanel';

const meta: Meta<typeof ReserveAllocationIntelligencePanel> = {
  title: 'Operational workspace/ReserveAllocationIntelligencePanel',
  component: ReserveAllocationIntelligencePanel,
};

export default meta;

type Story = StoryObj<typeof ReserveAllocationIntelligencePanel>;

export const Default: Story = {
  render: () => <ReserveAllocationIntelligencePanel />,
};
