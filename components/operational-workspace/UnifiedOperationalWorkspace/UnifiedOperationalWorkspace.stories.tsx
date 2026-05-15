import type { Meta, StoryObj } from '@storybook/react';
import UnifiedOperationalWorkspace from './index';

const meta: Meta<typeof UnifiedOperationalWorkspace> = {
  title: 'Operational workspace/UnifiedOperationalWorkspace',
  component: UnifiedOperationalWorkspace,
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj<typeof UnifiedOperationalWorkspace>;

export const Default: Story = {
  render: () => <UnifiedOperationalWorkspace compactIntelligencePanels={false} />,
};
