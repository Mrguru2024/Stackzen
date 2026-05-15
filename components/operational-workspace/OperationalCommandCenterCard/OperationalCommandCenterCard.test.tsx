import { render, screen } from '@testing-library/react';
import OperationalCommandCenterCard from '@/components/operational-workspace/OperationalCommandCenterCard';
import type { UnifiedOperationalCommandCenterDto } from '@/lib/operational-command-center/types';

const sample: UnifiedOperationalCommandCenterDto = {
  generatedAt: '2026-05-13T00:00:00.000Z',
  coordinationBullets: ['Reserve: elevated attention (5 factor(s)).'],
  subsystems: [
    {
      key: 'reserve',
      label: 'Reserve & allocation',
      band: 'escalating',
      headline: 'Reserve & allocation pressure is elevated',
      detail: 'Critical…',
      href: '/money-control?tab=rules',
      inputsUsed: { pressureScore: 5 },
    },
    {
      key: 'timing',
      label: 'Timing',
      band: 'stabilizing',
      headline: 'Timing ok',
      detail: 'No conflicts',
      href: '/operational-center/calendar',
      inputsUsed: {},
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
      headline: 'Workflow continuation',
      detail: '—',
      href: '/operational-center#operational-attention',
      inputsUsed: { queueSize: 2, pendingOperationalActionsCount: 0 },
    },
  ],
  stabilization: {
    momentumFactorCount: 2,
    momentumFactorCodes: ['CORRECTIVE_ACTIONS_APPLIED', 'ATTENTION_AUTO_RESOLVED'],
    attentionAutoResolvedInWindow: 1,
    appliedActionKindsInWindow: [{ kind: 'PAUSE_AUTOMATION_RULE', count: 1 }],
  },
  continuation: {
    pendingOperationalActionsCount: 0,
    pendingShiftBillProposalsCount: 0,
    openAttentionQueueSize: 2,
    oldestPendingProposalAgeDays: null,
    primaryCta: {
      href: '/operational-center#operational-attention',
      label: 'Review operational attention',
      reason: 'Unread operational notifications remain.',
    },
    executionHandoff: {
      source: 'command_center',
      ctaLadderStep: 5,
      focusSubsystem: 'workflow',
      focusBand: 'coordination',
    },
  },
  explain: { assumptions: ['Test assumption'], contributors: ['test'] },
};

describe('OperationalCommandCenterCard', () => {
  it('renders subsystem rows and primary CTA', () => {
    render(<OperationalCommandCenterCard data={sample} />);
    expect(screen.getByRole('heading', { name: /operational command center/i })).toBeInTheDocument();
    expect(screen.getByText('Reserve & allocation')).toBeInTheDocument();
    expect(screen.getByText(/Reserve & allocation pressure is elevated/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /review operational attention/i }).getAttribute('href')).toContain(
      'op_src=command_center'
    );
    expect(screen.getByRole('link', { name: /review operational attention/i }).getAttribute('href')).toContain(
      'op_step=5'
    );
  });

  it('shows band badges with operational copy', () => {
    render(<OperationalCommandCenterCard data={sample} />);
    expect(screen.getByText('Needs attention')).toBeInTheDocument();
    expect(screen.getByText('Coordinate')).toBeInTheDocument();
    expect(screen.getAllByText('Stable').length).toBeGreaterThanOrEqual(1);
  });

  it('returns null when data is null', () => {
    const { container } = render(<OperationalCommandCenterCard data={null} />);
    expect(container.firstChild).toBeNull();
  });
});
