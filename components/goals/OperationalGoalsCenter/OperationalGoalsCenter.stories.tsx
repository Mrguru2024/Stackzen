import type { Meta, StoryObj } from '@storybook/react';
import OperationalGoalsCenter from './index';

const meta: Meta<typeof OperationalGoalsCenter> = {
  title: 'Goals/OperationalGoalsCenter',
  component: OperationalGoalsCenter,
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj<typeof OperationalGoalsCenter>;

export const Default: Story = {
  render: () => <OperationalGoalsCenter />,
};
