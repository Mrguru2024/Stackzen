import { render, screen, waitFor } from '@testing-library/react';
import WorkflowResolutionPanel from '@/components/operational-workspace/WorkflowResolutionPanel';
import type { WorkflowResolutionSnapshotDto } from '@/lib/workflow-resolution/types';

const snap: WorkflowResolutionSnapshotDto = {
  generatedAt: new Date().toISOString(),
  windowDays: 14,
  momentumFactorCount: 2,
  factors: [
    {
      code: 'CORRECTIVE_ACTIONS_APPLIED',
      summary: '1 corrective operational action(s) applied in the last 14 day(s).',
      reasoning: ['Counts FinancialEvent rows of type OPERATIONAL_FINANCIAL_ACTION_APPLIED.'],
    },
    {
      code: 'GOAL_CONTRIBUTIONS_LOGGED',
      summary: '2 goal contribution(s) totaling $200.00 across 1 goal(s).',
      reasoning: ['Counts FinancialEvent rows of type GOAL_CONTRIBUTION_RECORDED.'],
    },
  ],
  appliedActions: [
    {
      kind: 'RECORD_GOAL_CONTRIBUTION',
      count: 1,
      oldestForecastBeforeAt: '2026-04-30T00:00:00.000Z',
      newestForecastAfterAt: '2026-05-01T00:00:00.000Z',
      latestBalanceDelta: {
        forecastSummaryBefore: {
          generatedAt: '2026-04-30T00:00:00.000Z',
          riskCodes: ['PROJECTED_LOW_BALANCE'],
          lowestProjectedBalance30d: 100,
          lowestProjectedBalanceDate30d: '2026-05-05T00:00:00.000Z',
          projectedEndingBalance30d: 250,
        },
        forecastSummaryAfter: {
          generatedAt: '2026-05-01T00:00:00.000Z',
          riskCodes: [],
          lowestProjectedBalance30d: 350,
          lowestProjectedBalanceDate30d: '2026-05-06T00:00:00.000Z',
          projectedEndingBalance30d: 450,
        },
        lowestProjectedBalanceDeltaUsd: 250,
        projectedEndingBalanceDeltaUsd: 200,
        capturedAtEventId: 'evt1',
        capturedAt: '2026-05-01T00:00:00.000Z',
      },
    },
  ],
  dismissedActionCount: 0,
  recommendationsIssuedInWindow: 3,
  attentionAutoResolvedInWindow: 4,
  goalContributions: { count: 2, totalUsd: 200, goalsTouched: 1, milestoneCount: 0 },
  activationMilestonesInWindow: 0,
  openAttention: { queueSize: 5, oldestPendingProposalAgeDays: 6, oldestPendingProposalNotificationId: 'n1' },
  explain: { assumptions: ['Test assumption.'], inputsUsed: { windowDays: 14, eventRowsScanned: 7 } },
};

describe('WorkflowResolutionPanel', () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => snap,
    } as Response);
  });

  it('renders momentum count, factor codes, and applied action balance delta', async () => {
    render(<WorkflowResolutionPanel />);
    await waitFor(() => {
      expect(screen.getByText(/momentumFactorCount = 2 \/ 5/i)).toBeInTheDocument();
      expect(screen.getByText('CORRECTIVE_ACTIONS_APPLIED')).toBeInTheDocument();
      expect(screen.getByText(/Goal contribution recorded/i)).toBeInTheDocument();
      expect(screen.getByText(/\(\+\$250\.00\)/)).toBeInTheDocument();
    });
  });
});
