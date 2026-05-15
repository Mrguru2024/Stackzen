import type { Meta, StoryObj } from '@storybook/react';
import MoneyControlCenter from '@/components/money-control';

/**
 * Operational money workflow — authenticated session required in Storybook decorators in real setups.
 */
const meta: Meta<typeof MoneyControlCenter> = {
  title: 'Screens/MoneyControlCenter',
  component: MoneyControlCenter,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;

type Story = StoryObj<typeof MoneyControlCenter>;

export const Default: Story = {
  render: () => (
    <div className="min-h-[80vh] bg-background p-4">
      <MoneyControlCenter />
    </div>
  ),
};
