import type { AutomationNotification, FinancialEvent } from '@prisma/client';
import {
  FinancialEntityType,
  FinancialEventSource,
  FinancialEventType,
} from '@prisma/client';
import { buildOperationalExplainability } from '@/lib/explainability/build-operational-explainability';
import type { OperationalTrustDto } from '@/lib/operational-notifications/types';

function mockNotification(over: Partial<AutomationNotification> & Pick<AutomationNotification, 'id'>): AutomationNotification {
  return {
    userId: 'user_1',
    type: 'AUTOMATION_ACTION',
    channel: 'IN_APP',
    severity: 'WARNING',
    title: 'T',
    body: 'B',
    readAt: null,
    relatedEntityType: null,
    relatedEntityId: null,
    metadata: {},
    createdAt: new Date('2026-05-01T12:00:00Z'),
    updatedAt: new Date('2026-05-01T12:00:00Z'),
    ...over,
  } as AutomationNotification;
}

function mockEvent(over: Partial<FinancialEvent> & Pick<FinancialEvent, 'id'>): FinancialEvent {
  return {
    userId: 'user_1',
    type: FinancialEventType.OPERATIONAL_ATTENTION_AUTO_RESOLVED,
    source: FinancialEventSource.API_AUTOMATION,
    amount: null,
    currency: 'USD',
    relatedEntityType: FinancialEntityType.AUTOMATION_NOTIFICATION,
    relatedEntityId: 'n1',
    metadata: { reason: 'test' },
    createdAt: new Date('2026-05-02T12:00:00Z'),
    ...over,
  } as FinancialEvent;
}

describe('buildOperationalExplainability', () => {
  const trust: OperationalTrustDto = {
    why: 'Because forecast showed low balance.',
    whatChanged: 'Bills clustered before income.',
    recommendedNextStep: 'Open Cash Flow.',
    sourceEventType: 'CASHFLOW_RISK_DETECTED',
  };

  it('parses guidance, cashflow, and goal blocks plus trust', () => {
    const meta = {
      attentionKind: 'guidance_test',
      guidance: {
        kind: 'CASH_FLOW_SAFETY',
        priority: 'high',
        riskCode: 'PROJECTED_LOW_BALANCE',
        calculations: ['Lowest balance = min(daily projection)'],
        inputsUsed: { horizonDays: 30 },
        expectedImpact: 'Reduce discretionary outflows.',
        confidence: 0.72,
      },
      guidanceEngineVersion: 1,
      cashflowRisk: {
        code: 'PROJECTED_LOW_BALANCE',
        confidence: 0.8,
        summary: 'Low balance',
        detail: 'Within 14 days',
      },
      goalPlanning: {
        findingCode: 'MISSED_TARGET_PACE',
        reasoningLines: ['Pace below target', 'Horizon shrinking'],
      },
    };

    const out = buildOperationalExplainability(
      mockNotification({ id: 'n1', metadata: meta }),
      meta,
      trust,
      [mockEvent({ id: 'e1', relatedEntityId: 'n1' })],
      Date.now()
    );

    expect(out.version).toBe(1);
    expect(out.attentionKind).toBe('guidance_test');
    expect(out.blocks.filter(b => b.kind === 'guidance_engine')).toHaveLength(1);
    expect(out.blocks.filter(b => b.kind === 'cashflow_risk')).toHaveLength(1);
    expect(out.blocks.filter(b => b.kind === 'goal_planning')).toHaveLength(1);
    expect(out.blocks.filter(b => b.kind === 'trust_reference')).toHaveLength(1);
    expect(out.auditTrail).toHaveLength(1);
    expect(out.auditTrail[0].type).toBe(FinancialEventType.OPERATIONAL_ATTENTION_AUTO_RESOLVED);
  });

  it('marks lifecycle resolved when autoResolvedAt present', () => {
    const meta = {
      attentionKind: 'cashflow_x',
      autoResolvedAt: '2026-05-03T10:00:00.000Z',
      autoResolvedReason: 'risk_cleared',
    };
    const out = buildOperationalExplainability(mockNotification({ id: 'n2', metadata: meta }), meta, trust, [], Date.now());
    expect(out.lifecycle.primary).toBe('resolved');
    expect(out.lifecycle.autoResolvedReason).toBe('risk_cleared');
  });
});
