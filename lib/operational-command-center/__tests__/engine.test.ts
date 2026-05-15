import type { OperationalActionListItemDto } from '@/lib/operational-actions/list-pending';
import type { ReserveAndContractorIntelligenceBundle } from '@/lib/reserve-allocation-intelligence/snapshot';
import type { WorkflowResolutionSnapshotDto } from '@/lib/workflow-resolution/types';
import { buildUnifiedOperationalCommandCenterDto } from '@/lib/operational-command-center/engine';

const discretionary = {
  lookbackDays: 30,
  sampleSize: 0,
  totalOutflowUsd: 0,
  discretionaryOutflowUsd: 0,
  discretionaryShare: 0,
  topDiscretionaryCategories: [] as { name: string; usd: number }[],
};

const baseReserve = {
  generatedAt: '2026-01-01T00:00:00.000Z',
  pressureScore: 0,
  factors: [] as { code: string; summary: string; reasoning: string[] }[],
  guidance: [] as { code: string; title: string; detail: string; reasoning: string[] }[],
  weeklyAllocationEstimateUsd: 0,
  enabledAllocationRuleCount: 0,
  enabledAllocationRulesSample: [] as { id: string; name: string; priority: number }[],
  reserveGoalUnderfillCount: 0,
  topUnderfilledReserveGoals: [] as {
    goalId: string;
    name: string;
    goalKind: 'EMERGENCY_FUND';
    targetAmount: 1000;
    currentAmount: 0;
    progress: 0;
  }[],
  discretionaryOutflowStats: discretionary,
  savingsRulesContext: { enabledCount: 0, totalCount: 0, sample: [] },
  explain: { assumptions: [], inputsUsed: {} },
};

const baseTiming = {
  generatedAt: '2026-01-01T00:00:00.000Z',
  pressureScore: 0,
  factors: [] as { code: 'OBLIGATION_CLUSTER_PRESENT'; summary: string; reasoning: string[] }[],
  clusters: [] as {
    id: string;
    startDate: string;
    endDate: string;
    bandDays: number;
    totalAmountUsd: number;
    dense: boolean;
    events: { date: string; amountUsd: number; label: string; kind: 'recurring_bill'; referenceIds: string[] }[];
    reasoning: string[];
  }[],
  conflicts: [] as {
    date: string;
    deficitUsd: number;
    precedingInflowUsd: number;
    outflowOnDayUsd: number;
    reasoning: string[];
  }[],
  instabilityWindow: null,
  reservePrepGoals: [] as {
    goalId: string;
    name: string;
    goalKind: 'EMERGENCY_FUND';
    progress: number;
  }[],
  guidance: [] as { code: 'DELAY_DISCRETIONARY_ALLOCATION'; title: string; detail: string; reasoning: string[] }[],
  calendarEntries: [] as {
    id: string;
    date: string;
    kind: 'recurring_bill';
    direction: 'OUTFLOW';
    label: string;
    amountUsd: number | null;
    referenceIds: string[];
    clusterId: string | null;
    shiftable: boolean;
    reasoning: string[];
  }[],
  explain: { assumptions: [], inputsUsed: {} },
};

const baseContractor = {
  generatedAt: '2026-01-01T00:00:00.000Z',
  hasContractorContext: false,
  jobsSample: [],
  materialExposure: [],
  negativeMarginJobs: [],
  openReceivables: [],
  receivableConcentration: {
    openInvoiceCount: 0,
    totalOpenUsd: 0,
    herfindahlIndex: 0,
    topClients: [],
    reasoning: [],
  },
  latePayerClients: [],
  collectionTiming: {
    windowDays: 14,
    upcomingWithinWindowCount: 0,
    meanDaysUntilDue: null,
    stdevDaysUntilDue: null,
    reasoning: [],
  },
  reserveNudges: [],
  forecastRiskCodes: [],
  explain: { assumptions: [], inputsUsed: {} },
};

const baseWorkflow: WorkflowResolutionSnapshotDto = {
  generatedAt: '2026-01-01T00:00:00.000Z',
  windowDays: 14,
  momentumFactorCount: 0,
  factors: [],
  appliedActions: [],
  dismissedActionCount: 0,
  recommendationsIssuedInWindow: 0,
  attentionAutoResolvedInWindow: 0,
  goalContributions: { count: 0, totalUsd: 0, goalsTouched: 0, milestoneCount: 0 },
  activationMilestonesInWindow: 0,
  openAttention: {
    queueSize: 0,
    oldestPendingProposalAgeDays: null,
    oldestPendingProposalNotificationId: null,
  },
  explain: { assumptions: [], inputsUsed: {} },
};

function run(
  bundle: Partial<ReserveAndContractorIntelligenceBundle>,
  workflow: Partial<WorkflowResolutionSnapshotDto>,
  pending: OperationalActionListItemDto[]
) {
  return buildUnifiedOperationalCommandCenterDto({
    bundle: {
      reserve: { ...baseReserve, ...bundle.reserve },
      timing: { ...baseTiming, ...bundle.timing },
      contractor: { ...baseContractor, ...bundle.contractor },
    } as ReserveAndContractorIntelligenceBundle,
    workflow: { ...baseWorkflow, ...workflow } as WorkflowResolutionSnapshotDto,
    pendingProposals: pending,
  });
}

describe('buildUnifiedOperationalCommandCenterDto', () => {
  it('marks reserve escalating when isElevatedReservePressure is true', () => {
    const out = run(
      {
        reserve: {
          ...baseReserve,
          pressureScore: 5,
          factors: [{ code: 'PROJECTED_LOW_BALANCE_CRITICAL', summary: 'x', reasoning: [] }],
        },
      },
      {},
      []
    );
    expect(out.subsystems.find(s => s.key === 'reserve')?.band).toBe('escalating');
  });

  it('marks timing escalating when conflicts exist', () => {
    const out = run(
      {
        timing: {
          ...baseTiming,
          conflicts: [
            {
              date: '2026-06-01',
              deficitUsd: 100,
              precedingInflowUsd: 0,
              outflowOnDayUsd: 100,
              reasoning: [],
            },
          ],
        },
      },
      {},
      []
    );
    expect(out.subsystems.find(s => s.key === 'timing')?.band).toBe('escalating');
  });

  it('stabilizes contractor with no contractor context headline', () => {
    const out = run({}, {}, []);
    const row = out.subsystems.find(s => s.key === 'contractor');
    expect(row?.band).toBe('stabilizing');
    expect(row?.headline).toBe('No contractor context');
  });

  it('escalates workflow when oldest pending proposal age ≥7', () => {
    const out = run(
      {},
      {
        openAttention: {
          queueSize: 2,
          oldestPendingProposalAgeDays: 8,
          oldestPendingProposalNotificationId: 'n1',
        },
      },
      []
    );
    expect(out.subsystems.find(s => s.key === 'workflow')?.band).toBe('escalating');
  });

  it('CTA ladder: pending ops wins first', () => {
    const pending: OperationalActionListItemDto[] = [
      {
        notificationId: 'n1',
        attentionKind: 'operational_action_pause_x',
        title: 'Pause',
        body: 'Body',
        kind: 'PAUSE_AUTOMATION_RULE',
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    ];
    const out = run({}, {}, pending);
    expect(out.continuation.primaryCta.href).toBe('/operational-center#operational-actions');
    expect(out.continuation.primaryCta.label).toBe('Preview pending operational actions');
    expect(out.continuation.pendingOperationalActionsCount).toBe(1);
    expect(out.continuation.executionHandoff?.ctaLadderStep).toBe(1);
  });

  it('CTA ladder: shift proposal without pending count still prefers calendar over reserve', () => {
    const pending: OperationalActionListItemDto[] = [
      {
        notificationId: 'n2',
        attentionKind: 'x',
        title: 'Shift',
        body: 'Body',
        kind: 'SHIFT_RECURRING_BILL_DATE',
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    ];
    const out = run(
      {
        reserve: {
          ...baseReserve,
          pressureScore: 5,
          factors: [{ code: 'PROJECTED_LOW_BALANCE_CRITICAL', summary: 'x', reasoning: [] }],
        },
      },
      {},
      pending
    );
    expect(out.continuation.primaryCta.href).toBe('/operational-center#operational-actions');
    expect(out.continuation.pendingShiftBillProposalsCount).toBe(1);
  });

  it('CTA ladder: timing escalation routes to calendar when no pending ops', () => {
    const bundle = {
      timing: {
        ...baseTiming,
        pressureScore: 4,
        factors: [
          { code: 'OBLIGATION_CLUSTER_DENSE', summary: 'dense', reasoning: [] },
          { code: 'OBLIGATION_CLUSTER_PRESENT', summary: 'c', reasoning: [] },
          { code: 'PAYOUT_BILL_CONFLICT', summary: 'p', reasoning: [] },
        ],
        clusters: [
          {
            id: 'c1',
            startDate: '2026-06-01',
            endDate: '2026-06-05',
            bandDays: 5,
            totalAmountUsd: 999,
            dense: true,
            events: [],
            reasoning: [],
          },
        ],
      },
    };
    const out = run(bundle, {}, []);
    expect(out.subsystems.find(s => s.key === 'timing')?.band).toBe('escalating');
    expect(out.continuation.primaryCta.href).toBe('/operational-center/calendar');
    expect(out.continuation.primaryCta.label).toBe('Coordinate timing on the calendar');
    expect(out.continuation.executionHandoff?.ctaLadderStep).toBe(2);
  });

  it('CTA ladder: reserve escalation when timing quiet and no proposals', () => {
    const bundle = {
      reserve: {
        ...baseReserve,
        pressureScore: 5,
        factors: [{ code: 'PROJECTED_LOW_BALANCE_CRITICAL', summary: 'x', reasoning: [] }],
      },
    };
    const out = run(bundle, {}, []);
    expect(out.continuation.primaryCta.href).toBe('/money-control?tab=rules');
    expect(out.continuation.primaryCta.label).toBe('Adjust rules / buckets');
    expect(out.continuation.executionHandoff?.ctaLadderStep).toBe(3);
  });

  it('CTA ladder: attention queue when nothing else matches', () => {
    const out = run(
      {
        contractor: {
          ...baseContractor,
          hasContractorContext: true,
          negativeMarginJobs: [],
          materialExposure: [],
          latePayerClients: [],
          openReceivables: [],
          reserveNudges: [],
        },
      },
      { openAttention: { queueSize: 3, oldestPendingProposalAgeDays: 1, oldestPendingProposalNotificationId: null } },
      []
    );
    expect(out.continuation.primaryCta.href).toBe('/operational-center#operational-attention');
    expect(out.continuation.primaryCta.label).toBe('Review operational attention');
    expect(out.continuation.executionHandoff?.ctaLadderStep).toBe(5);
  });

  it('CTA ladder: default cash flow when all quiet', () => {
    const out = run({}, {}, []);
    expect(out.continuation.primaryCta.href).toBe('/cash-flow');
    expect(out.continuation.primaryCta.label).toBe('Review cash flow forecast');
    expect(out.continuation.executionHandoff?.ctaLadderStep).toBe(6);
  });

  it('CTA ladder: contractor escalation routes to invoices when higher steps do not match', () => {
    const out = run(
      {
        contractor: {
          ...baseContractor,
          hasContractorContext: true,
          negativeMarginJobs: [
            {
              jobId: 'j1',
              title: 'Job',
              clientId: 'c1',
              estimatedProfit: -50,
              jobRevenue: 100,
              jobExpenses: 150,
              reasoning: [],
            },
          ],
          materialExposure: [],
          latePayerClients: [],
          openReceivables: [],
          reserveNudges: [],
        },
      },
      { openAttention: { queueSize: 0, oldestPendingProposalAgeDays: null, oldestPendingProposalNotificationId: null } },
      []
    );
    expect(out.subsystems.find(s => s.key === 'contractor')?.band).toBe('escalating');
    expect(out.continuation.primaryCta.href).toBe('/invoices');
    expect(out.continuation.primaryCta.label).toBe('Triage contractor receivables');
    expect(out.continuation.executionHandoff?.ctaLadderStep).toBe(4);
  });

  it('exposes subsystem keys, labels, and hrefs', () => {
    const out = run({}, {}, []);
    expect(out.subsystems.map(s => s.key)).toEqual(['reserve', 'timing', 'contractor', 'workflow']);
    expect(out.subsystems.every(s => typeof s.label === 'string' && s.href.startsWith('/'))).toBe(true);
  });

  it('maps stabilization from workflow snapshot only', () => {
    const out = run(
      {},
      {
        momentumFactorCount: 2,
        factors: [
          { code: 'CORRECTIVE_ACTIONS_APPLIED', summary: '', reasoning: [] },
          { code: 'ATTENTION_AUTO_RESOLVED', summary: '', reasoning: [] },
        ],
        attentionAutoResolvedInWindow: 3,
        appliedActions: [
          {
            kind: 'PAUSE_AUTOMATION_RULE',
            count: 2,
            oldestForecastBeforeAt: null,
            newestForecastAfterAt: null,
            latestBalanceDelta: null,
          },
        ],
      },
      []
    );
    expect(out.stabilization.momentumFactorCount).toBe(2);
    expect(out.stabilization.momentumFactorCodes).toEqual(['CORRECTIVE_ACTIONS_APPLIED', 'ATTENTION_AUTO_RESOLVED']);
    expect(out.stabilization.attentionAutoResolvedInWindow).toBe(3);
    expect(out.stabilization.appliedActionKindsInWindow).toEqual([{ kind: 'PAUSE_AUTOMATION_RULE', count: 2 }]);
  });
});
