import {
  FinancialEventSource,
  FinancialEventType,
  type FinancialEvent,
} from '@prisma/client';
import {
  aggregateAppliedActions,
  aggregateGoalContributions,
  buildOpenAttentionState,
  buildResolutionMomentumFactors,
  clampWindowDays,
  countActivationMilestones,
  countAttentionAutoResolved,
  countDismissedActions,
  countRecommendationsIssued,
} from '@/lib/workflow-resolution/aggregate';

function event(partial: Partial<FinancialEvent>): FinancialEvent {
  return {
    id: partial.id ?? 'e',
    userId: 'u',
    type: partial.type ?? FinancialEventType.GOAL_CONTRIBUTION_RECORDED,
    source: partial.source ?? FinancialEventSource.API_GOALS,
    amount: partial.amount ?? null,
    currency: partial.currency ?? 'USD',
    metadata: (partial.metadata ?? null) as FinancialEvent['metadata'],
    relatedEntityType: partial.relatedEntityType ?? null,
    relatedEntityId: partial.relatedEntityId ?? null,
    createdAt: partial.createdAt ?? new Date('2026-05-05T00:00:00Z'),
    updatedAt: partial.updatedAt ?? new Date('2026-05-05T00:00:00Z'),
  };
}

describe('aggregateAppliedActions', () => {
  it('groups by kind and tracks oldest before / newest after timestamps', () => {
    const events: FinancialEvent[] = [
      event({
        type: FinancialEventType.OPERATIONAL_FINANCIAL_ACTION_APPLIED,
        metadata: {
          kind: 'RECORD_GOAL_CONTRIBUTION',
          forecastBeforeAt: '2026-05-01T00:00:00.000Z',
          forecastAfterAt: '2026-05-02T00:00:00.000Z',
        },
      }),
      event({
        type: FinancialEventType.OPERATIONAL_FINANCIAL_ACTION_APPLIED,
        metadata: {
          kind: 'RECORD_GOAL_CONTRIBUTION',
          forecastBeforeAt: '2026-04-30T00:00:00.000Z',
          forecastAfterAt: '2026-05-03T00:00:00.000Z',
        },
      }),
      event({
        type: FinancialEventType.OPERATIONAL_FINANCIAL_ACTION_APPLIED,
        metadata: { kind: 'PAUSE_AUTOMATION_RULE' },
      }),
      event({ type: FinancialEventType.GOAL_CONTRIBUTION_RECORDED }),
    ];
    const out = aggregateAppliedActions(events);
    const contrib = out.find(o => o.kind === 'RECORD_GOAL_CONTRIBUTION');
    expect(contrib?.count).toBe(2);
    expect(contrib?.oldestForecastBeforeAt).toBe('2026-04-30T00:00:00.000Z');
    expect(contrib?.newestForecastAfterAt).toBe('2026-05-03T00:00:00.000Z');
    expect(contrib?.latestBalanceDelta).toBeNull();
    expect(out.find(o => o.kind === 'PAUSE_AUTOMATION_RULE')?.count).toBe(1);
    expect(out.find(o => o.kind === 'EXTEND_GOAL_TARGET_DATE')).toBeUndefined();
  });

  it('skips unknown kinds gracefully', () => {
    const out = aggregateAppliedActions([
      event({
        type: FinancialEventType.OPERATIONAL_FINANCIAL_ACTION_APPLIED,
        metadata: { kind: 'BOGUS_KIND' },
      }),
    ]);
    expect(out).toHaveLength(0);
  });

  it('returns the latest balance delta when forecast summaries are persisted', () => {
    const olderSummaryBefore = {
      generatedAt: '2026-04-29T00:00:00.000Z',
      riskCodes: [],
      lowestProjectedBalance30d: 50,
      lowestProjectedBalanceDate30d: '2026-05-01T00:00:00.000Z',
      projectedEndingBalance30d: 100,
    };
    const olderSummaryAfter = {
      generatedAt: '2026-04-30T00:00:00.000Z',
      riskCodes: [],
      lowestProjectedBalance30d: 75,
      lowestProjectedBalanceDate30d: '2026-05-02T00:00:00.000Z',
      projectedEndingBalance30d: 110,
    };
    const newerSummaryBefore = {
      generatedAt: '2026-05-02T00:00:00.000Z',
      riskCodes: ['PROJECTED_LOW_BALANCE'],
      lowestProjectedBalance30d: 80,
      lowestProjectedBalanceDate30d: '2026-05-05T00:00:00.000Z',
      projectedEndingBalance30d: 120,
    };
    const newerSummaryAfter = {
      generatedAt: '2026-05-03T00:00:00.000Z',
      riskCodes: [],
      lowestProjectedBalance30d: 240,
      lowestProjectedBalanceDate30d: '2026-05-06T00:00:00.000Z',
      projectedEndingBalance30d: 300,
    };
    const events: FinancialEvent[] = [
      event({
        id: 'older',
        createdAt: new Date('2026-04-30T00:00:00Z'),
        type: FinancialEventType.OPERATIONAL_FINANCIAL_ACTION_APPLIED,
        metadata: {
          kind: 'PAUSE_AUTOMATION_RULE',
          forecastSummaryBefore: olderSummaryBefore,
          forecastSummaryAfter: olderSummaryAfter,
        },
      }),
      event({
        id: 'newer',
        createdAt: new Date('2026-05-03T00:00:00Z'),
        type: FinancialEventType.OPERATIONAL_FINANCIAL_ACTION_APPLIED,
        metadata: {
          kind: 'PAUSE_AUTOMATION_RULE',
          forecastSummaryBefore: newerSummaryBefore,
          forecastSummaryAfter: newerSummaryAfter,
        },
      }),
    ];
    const out = aggregateAppliedActions(events);
    const pause = out.find(o => o.kind === 'PAUSE_AUTOMATION_RULE');
    expect(pause?.count).toBe(2);
    expect(pause?.latestBalanceDelta?.capturedAtEventId).toBe('newer');
    expect(pause?.latestBalanceDelta?.lowestProjectedBalanceDeltaUsd).toBeCloseTo(160);
    expect(pause?.latestBalanceDelta?.projectedEndingBalanceDeltaUsd).toBeCloseTo(180);
    expect(pause?.latestBalanceDelta?.forecastSummaryBefore.generatedAt).toBe('2026-05-02T00:00:00.000Z');
  });
});

describe('aggregateGoalContributions', () => {
  it('sums amounts, counts goals, separates milestone events', () => {
    const events: FinancialEvent[] = [
      event({
        type: FinancialEventType.GOAL_CONTRIBUTION_RECORDED,
        amount: 100,
        relatedEntityId: 'g1',
      }),
      event({
        type: FinancialEventType.GOAL_CONTRIBUTION_RECORDED,
        amount: 50,
        relatedEntityId: 'g1',
      }),
      event({
        type: FinancialEventType.GOAL_CONTRIBUTION_RECORDED,
        amount: 25,
        relatedEntityId: 'g2',
      }),
      event({ type: FinancialEventType.GOAL_MILESTONE_REACHED, relatedEntityId: 'g1' }),
    ];
    const out = aggregateGoalContributions(events);
    expect(out.count).toBe(3);
    expect(out.totalUsd).toBeCloseTo(175);
    expect(out.goalsTouched).toBe(2);
    expect(out.milestoneCount).toBe(1);
  });

  it('ignores negative or non-finite amounts', () => {
    const out = aggregateGoalContributions([
      event({ type: FinancialEventType.GOAL_CONTRIBUTION_RECORDED, amount: -10 }),
      event({ type: FinancialEventType.GOAL_CONTRIBUTION_RECORDED, amount: Number.NaN }),
    ]);
    expect(out.count).toBe(2);
    expect(out.totalUsd).toBe(0);
  });
});

describe('counts and momentum factors', () => {
  it('counts auto-resolved and activation milestones', () => {
    const events: FinancialEvent[] = [
      event({ type: FinancialEventType.OPERATIONAL_ATTENTION_AUTO_RESOLVED }),
      event({ type: FinancialEventType.OPERATIONAL_ATTENTION_AUTO_RESOLVED }),
      event({ type: FinancialEventType.OPERATIONAL_ACTIVATION_MILESTONE }),
    ];
    expect(countAttentionAutoResolved(events)).toBe(2);
    expect(countActivationMilestones(events)).toBe(1);
  });

  it('builds factors only for non-zero counts', () => {
    const factors = buildResolutionMomentumFactors({
      appliedActions: [
        { kind: 'PAUSE_AUTOMATION_RULE', count: 1, oldestForecastBeforeAt: null, newestForecastAfterAt: null },
      ],
      attentionAutoResolved: 0,
      goalContributions: { count: 0, totalUsd: 0, goalsTouched: 0, milestoneCount: 0 },
      activationMilestonesInWindow: 0,
      windowDays: 14,
    });
    expect(factors.map(f => f.code)).toEqual(['CORRECTIVE_ACTIONS_APPLIED']);
  });
});

describe('notification-derived counts', () => {
  const now = new Date('2026-05-10T12:00:00Z');
  const since = new Date('2026-04-26T12:00:00Z').getTime();

  it('counts recommendations issued from operational_action_* attentionKinds', () => {
    const rows = [
      {
        id: 'n1',
        createdAt: new Date('2026-05-05T00:00:00Z'),
        readAt: null,
        metadata: {
          attentionKind: 'operational_action_pause_rule_x',
          operationalActionProposal: {
            version: 1,
            status: 'pending',
            kind: 'PAUSE_AUTOMATION_RULE',
            fingerprint: 'fp',
            payload: {},
            explain: {},
            lastForecastGeneratedAt: '2026-05-04T00:00:00Z',
          },
        },
      },
      {
        id: 'n2',
        createdAt: new Date('2026-04-20T00:00:00Z'),
        readAt: null,
        metadata: { attentionKind: 'operational_action_goal_contribution_y' },
      },
      {
        id: 'n3',
        createdAt: new Date('2026-05-09T00:00:00Z'),
        readAt: null,
        metadata: { attentionKind: 'guidance_low_balance' },
      },
    ];
    expect(countRecommendationsIssued(rows, since)).toBe(1);
  });

  it('counts dismissed actions inside the window only', () => {
    const rows = [
      {
        id: 'n1',
        createdAt: new Date('2026-05-01T00:00:00Z'),
        readAt: new Date('2026-05-02T00:00:00Z'),
        metadata: {
          attentionKind: 'operational_action_pause_rule_x',
          dismissedAt: '2026-05-02T00:00:00Z',
        },
      },
      {
        id: 'n2',
        createdAt: new Date('2026-03-01T00:00:00Z'),
        readAt: new Date('2026-03-02T00:00:00Z'),
        metadata: {
          attentionKind: 'operational_action_pause_rule_y',
          dismissedAt: '2026-03-02T00:00:00Z',
        },
      },
      {
        id: 'n3',
        createdAt: new Date('2026-05-01T00:00:00Z'),
        readAt: null,
        metadata: { attentionKind: 'cashflow_projected_low_balance' },
      },
    ];
    expect(countDismissedActions(rows, since)).toBe(1);
  });

  it('finds oldest pending proposal age and id', () => {
    const rows = [
      {
        id: 'n1',
        createdAt: new Date('2026-05-04T00:00:00Z'),
        readAt: null,
        metadata: {
          attentionKind: 'operational_action_pause_rule_x',
          operationalActionProposal: {
            version: 1,
            status: 'pending',
            kind: 'PAUSE_AUTOMATION_RULE',
            fingerprint: 'fp',
            payload: {},
            explain: {},
            lastForecastGeneratedAt: '2026-05-04T00:00:00Z',
          },
        },
      },
      {
        id: 'n2',
        createdAt: new Date('2026-05-01T00:00:00Z'),
        readAt: null,
        metadata: {
          attentionKind: 'operational_action_goal_contribution_y',
          operationalActionProposal: {
            version: 1,
            status: 'pending',
            kind: 'RECORD_GOAL_CONTRIBUTION',
            fingerprint: 'fp',
            payload: {},
            explain: {},
            lastForecastGeneratedAt: '2026-05-01T00:00:00Z',
          },
        },
      },
    ];
    const out = buildOpenAttentionState(rows, 2, now);
    expect(out.queueSize).toBe(2);
    expect(out.oldestPendingProposalAgeDays).toBe(9);
    expect(out.oldestPendingProposalNotificationId).toBe('n2');
  });
});

describe('clampWindowDays', () => {
  it('clamps to [1, 60] and parses string input', () => {
    expect(clampWindowDays('30')).toBe(30);
    expect(clampWindowDays(0)).toBe(1);
    expect(clampWindowDays(120)).toBe(60);
    expect(clampWindowDays('not-a-number')).toBe(14);
    expect(clampWindowDays(undefined)).toBe(14);
  });
});
