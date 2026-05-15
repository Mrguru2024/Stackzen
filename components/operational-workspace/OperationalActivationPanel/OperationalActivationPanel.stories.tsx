import type { Meta, StoryObj } from '@storybook/react';
import OperationalActivationPanel from './index';

const meta: Meta<typeof OperationalActivationPanel> = {
  title: 'Operational workspace/OperationalActivationPanel',
  component: OperationalActivationPanel,
  parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj<typeof OperationalActivationPanel>;

export const Default: Story = {};
