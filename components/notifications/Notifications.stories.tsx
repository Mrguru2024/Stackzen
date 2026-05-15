import type { Meta, StoryObj } from '@storybook/react';
import OperationalAlertCenter from '@/components/operational-center/OperationalAlertCenter';

const meta: Meta<typeof OperationalAlertCenter> = {
  title: 'Core/Operational attention (legacy Notifications slot)',
  component: OperationalAlertCenter,
};
export default meta;

type Story = StoryObj<typeof OperationalAlertCenter>;

export const OperationalCenterEmbedded: Story = {
  render: () => (
    <div className="p-4">
      <OperationalAlertCenter embedded />
    </div>
  ),
};
