import { render, screen, waitFor } from '@testing-library/react';
import { OperationalGoalKind } from '@prisma/client';
import ReserveAllocationIntelligencePanel from '@/components/operational-workspace/ReserveAllocationIntelligencePanel';
import type { ReserveAllocationSnapshotDto } from '@/lib/reserve-allocation-intelligence/types';

const mockSnap: ReserveAllocationSnapshotDto = {
  generatedAt: new Date().toISOString(),
  pressureScore: 2,
  factors: [
    {
      code: 'ALLOCATION_PRESSURE',
      summary: 'Automation allocations may compress usable cash.',
      reasoning: ['Detail from forecast.'],
    },
  ],
  guidance: [
    {
      code: 'REVIEW_DISCRETIONARY_AUTOMATION',
      title: 'Review discretionary allocation automation',
      detail: 'Open Money Control.',
      reasoning: ['Uses trailing SmartAllocation pace.'],
    },
  ],
  weeklyAllocationEstimateUsd: 120,
  enabledAllocationRuleCount: 1,
  enabledAllocationRulesSample: [{ id: 'r1', name: 'Test rule', priority: 10 }],
  reserveGoalUnderfillCount: 1,
  topUnderfilledReserveGoals: [
    {
      goalId: 'goal-emergency',
      name: 'Emergency fund',
      goalKind: OperationalGoalKind.EMERGENCY_FUND,
      targetAmount: 1000,
      currentAmount: 100,
      progress: 0.1,
    },
  ],
  discretionaryOutflowStats: {
    lookbackDays: 30,
    sampleSize: 12,
    totalOutflowUsd: 400,
    discretionaryOutflowUsd: 200,
    discretionaryShare: 0.5,
    topDiscretionaryCategories: [{ name: 'Dining out', usd: 200 }],
  },
  savingsRulesContext: {
    enabledCount: 2,
    totalCount: 3,
    sample: [
      { id: 's1', name: 'Round-up rule', type: 'ROUND_UP' },
      { id: 's2', name: 'Payday split', type: 'PAYCHECK_SPLIT' },
    ],
  },
  explain: {
    assumptions: ['Test assumption.'],
    inputsUsed: { factorCount: 2 },
  },
};

describe('ReserveAllocationIntelligencePanel', () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => mockSnap,
    } as Response);
  });

  it('renders pressure score, factor codes, and v2 fields', async () => {
    render(<ReserveAllocationIntelligencePanel />);
    await waitFor(() => {
      expect(screen.getByText(/pressureScore = 2/i)).toBeInTheDocument();
      expect(screen.getByText('ALLOCATION_PRESSURE')).toBeInTheDocument();
      expect(screen.getByText(/Test rule/i)).toBeInTheDocument();
      expect(screen.getByText(/Round-up rule/i)).toBeInTheDocument();
      expect(screen.getByText(/Emergency fund/i)).toBeInTheDocument();
      expect(screen.getByText(/Dining out/i)).toBeInTheDocument();
    });
  });

  it('folds rule samples into details when compactSummary', async () => {
    render(<ReserveAllocationIntelligencePanel compactSummary />);
    await waitFor(() => {
      expect(screen.getByText(/Rules, savings & discretionary detail/i)).toBeInTheDocument();
      expect(screen.getByText(/pressureScore = 2/i)).toBeInTheDocument();
    });
  });
});
