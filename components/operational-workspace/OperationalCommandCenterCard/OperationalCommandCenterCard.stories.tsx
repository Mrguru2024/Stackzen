import type { Meta, StoryObj } from '@storybook/react';
import OperationalCommandCenterCard from '@/components/operational-workspace/OperationalCommandCenterCard';
import type { UnifiedOperationalCommandCenterDto } from '@/lib/operational-command-center/types';

const meta: Meta<typeof OperationalCommandCenterCard> = {
  title: 'Operational workspace/OperationalCommandCenterCard',
  component: OperationalCommandCenterCard,
  parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj<typeof OperationalCommandCenterCard>;

const mock: UnifiedOperationalCommandCenterDto = {
  generatedAt: '2026-05-13T00:00:00.000Z',
  coordinationBullets: ['Reserve: elevated attention (5 factor(s); PROJECTED_LOW_BALANCE_CRITICAL present).'],
  subsystems: [
    {
      key: 'reserve',
      label: 'Reserve & allocation',
      band: 'escalating',
      headline: 'Reserve & allocation pressure is elevated',
      detail: 'Critical low-balance signal…',
      href: '/money-control?tab=rules',
      inputsUsed: { pressureScore: 5 },
    },
    {
      key: 'timing',
      label: 'Timing',
      band: 'coordination',
      headline: 'Timing coordination recommended',
      detail: 'Clusters present.',
      href: '/operational-center/calendar',
      inputsUsed: { clusterCount: 2 },
    },
    {
      key: 'contractor',
      label: 'Contractor',
      band: 'stabilizing',
      headline: 'No contractor context',
      detail: '—',
      href: '/invoices',
      inputsUsed: { hasContractorContext: false },
    },
    {
      key: 'workflow',
      label: 'Workflow & attention',
      band: 'coordination',
      headline: 'Workflow continuation available',
      detail: '—',
      href: '/operational-center#operational-attention',
      inputsUsed: { queueSize: 2 },
    },
  ],
  stabilization: {
    momentumFactorCount: 1,
    momentumFactorCodes: ['CORRECTIVE_ACTIONS_APPLIED'],
    attentionAutoResolvedInWindow: 0,
    appliedActionKindsInWindow: [],
  },
  continuation: {
    pendingOperationalActionsCount: 0,
    pendingShiftBillProposalsCount: 0,
    openAttentionQueueSize: 2,
    oldestPendingProposalAgeDays: null,
    primaryCta: {
      href: '/operational-center#operational-attention',
      label: 'Review operational attention',
      reason: 'Queue has unread items.',
    },
    executionHandoff: {
      source: 'command_center',
      ctaLadderStep: 5,
      focusSubsystem: 'workflow',
      focusBand: 'coordination',
    },
  },
  explain: { assumptions: ['Bands are threshold-driven.'], contributors: ['workflow-resolution'] },
};

export const WithData: Story = {
  render: () => <OperationalCommandCenterCard data={mock} />,
};

export const LoadingEmpty: Story = {
  render: () => <OperationalCommandCenterCard data={null} />,
};
