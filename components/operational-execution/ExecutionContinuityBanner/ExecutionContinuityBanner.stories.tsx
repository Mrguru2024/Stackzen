import type { Meta, StoryObj } from '@storybook/react';
import { ExecutionContinuityBoundary } from '@/components/operational-execution/ExecutionContinuityBanner';

const meta: Meta<typeof ExecutionContinuityBoundary> = {
  title: 'Operational execution/ExecutionContinuityBoundary',
  component: ExecutionContinuityBoundary,
  parameters: { layout: 'padded', nextjs: { navigation: { query: { op_src: 'command_center', op_step: '2', op_sub: 'timing', op_band: 'escalating' } } } },
};

export default meta;
type Story = StoryObj<typeof ExecutionContinuityBoundary>;

export const Default: Story = {
  render: () => (
    <div className="max-w-3xl">
      <p className="mb-4 text-sm text-muted-foreground">
        In Storybook, add <code className="rounded bg-muted px-1">?op_src=command_center&amp;op_step=2</code> via
        Next parameters when supported, or verify in-app navigation from the command center.
      </p>
      <ExecutionContinuityBoundary />
    </div>
  ),
};
