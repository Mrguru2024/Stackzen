import { render, screen, waitFor } from '@testing-library/react';
import { OperationalGoalKind } from '@prisma/client';
import TimingCoordinationPanel from '@/components/operational-workspace/TimingCoordinationPanel';
import type { TimingCoordinationSnapshotDto } from '@/lib/timing-coordination/types';

const snap: TimingCoordinationSnapshotDto = {
  generatedAt: '2026-06-01T00:00:00.000Z',
  pressureScore: 4,
  factors: [
    {
      code: 'OBLIGATION_CLUSTER_PRESENT',
      summary: 'Detected 1 obligation cluster.',
      reasoning: ['At least one cluster of ≥3 outflows summing ≥$200 within a 5-day band exists.'],
    },
    {
      code: 'OBLIGATION_CLUSTER_DENSE',
      summary: 'Top cluster totals $600 (> 30% of starting balance).',
      reasoning: ['Cluster id c-1 marked dense.'],
    },
    {
      code: 'RESERVE_PREP_BEHIND_CLUSTER',
      summary: '1 reserve goal under 50% with a cluster in ≤7 days.',
      reasoning: ['Affected goal: goal-1.'],
    },
    {
      code: 'PAYOUT_BILL_CONFLICT',
      summary: 'Cumulative outflow exceeds cumulative inflow on 2026-06-02 by $200.',
      reasoning: ['1 conflict day detected.'],
    },
  ],
  clusters: [
    {
      id: 'c-1',
      startDate: '2026-06-01',
      endDate: '2026-06-05',
      bandDays: 5,
      totalAmountUsd: 600,
      dense: true,
      events: [
        { date: '2026-06-01', amountUsd: 200, label: 'Rent', kind: 'recurring_bill', referenceIds: ['b1'] },
        { date: '2026-06-02', amountUsd: 200, label: 'Card', kind: 'recurring_bill', referenceIds: ['b2'] },
        { date: '2026-06-03', amountUsd: 200, label: 'Loan', kind: 'recurring_bill', referenceIds: ['b3'] },
      ],
      reasoning: [],
    },
  ],
  conflicts: [
    { date: '2026-06-02', deficitUsd: 200, precedingInflowUsd: 100, outflowOnDayUsd: 300, reasoning: [] },
  ],
  instabilityWindow: null,
  reservePrepGoals: [
    {
      goalId: 'goal-1',
      name: 'Emergency Fund',
      goalKind: OperationalGoalKind.EMERGENCY_FUND,
      progress: 0.2,
    },
  ],
  guidance: [
    {
      code: 'PREPARE_RESERVE_BUFFER',
      title: 'Prepare a reserve buffer for the upcoming cluster',
      detail: 'Fund Emergency Fund before the cluster window opens.',
      reasoning: ['Reserve goal is below 50%.'],
    },
  ],
  calendarEntries: [],
  explain: { assumptions: [], inputsUsed: {} },
};

describe('TimingCoordinationPanel', () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => snap,
    } as Response);
  });

  it('renders pressure score, dense cluster row, conflicts and guidance', async () => {
    render(<TimingCoordinationPanel />);
    await waitFor(() => {
      expect(screen.getByText(/pressureScore = 4/i)).toBeInTheDocument();
      expect(screen.getByText(/Obligation cluster is dense/i)).toBeInTheDocument();
      expect(screen.getByText(/2026-06-01/)).toBeInTheDocument();
      expect(screen.getByText(/Prepare a reserve buffer/i)).toBeInTheDocument();
      expect(screen.getByText(/Payout vs bill timing conflict/i)).toBeInTheDocument();
    });
  });

  it('links to the dedicated /operational-center/calendar page (not an in-page anchor)', async () => {
    render(<TimingCoordinationPanel />);
    const links = await screen.findAllByRole('link', { name: /timing calendar/i });
    expect(links.length).toBeGreaterThan(0);
    for (const link of links) {
      expect(link.getAttribute('href')).toBe('/operational-center/calendar');
    }
  });
});
