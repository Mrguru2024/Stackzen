import type { Meta, StoryObj } from '@storybook/react';
import OperationalAlertCenter from '@/components/operational-center/OperationalAlertCenter';

const meta: Meta<typeof OperationalAlertCenter> = {
  title: 'Operational / Attention center shell',
  component: OperationalAlertCenter,
};
export default meta;

type Story = StoryObj<typeof OperationalAlertCenter>;

export const FullPagePlaceholder: Story = {
  decorators: [],
  parameters: {
    layout: 'padded',
  },
  render: () => (
    <div className="max-w-4xl">
      <OperationalAlertCenter />
    </div>
  ),
};
