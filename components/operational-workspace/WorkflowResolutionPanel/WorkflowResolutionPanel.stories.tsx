import type { Meta, StoryObj } from '@storybook/react';
import WorkflowResolutionPanel from '@/components/operational-workspace/WorkflowResolutionPanel';

const meta: Meta<typeof WorkflowResolutionPanel> = {
  title: 'Operational workspace/WorkflowResolutionPanel',
  component: WorkflowResolutionPanel,
};

export default meta;

type Story = StoryObj<typeof WorkflowResolutionPanel>;

export const Default: Story = {
  render: () => <WorkflowResolutionPanel />,
};
