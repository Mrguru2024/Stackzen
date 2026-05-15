import type { NotificationSeverity } from '@prisma/client';
import type { OperationalAlertDto } from '@/lib/operational-notifications/types';
import { stubOperationalExplainability } from '@/lib/explainability/stub';
import { dedupeOperationalAlerts, pickAlertWinner, rankOperationalAlerts } from '@/lib/workspace/priority-engine';

function mockAlert(partial: Partial<OperationalAlertDto> & Pick<OperationalAlertDto, 'id'>): OperationalAlertDto {
  return {
    automationType: 'AUTOMATION_ACTION' as OperationalAlertDto['automationType'],
    domain: 'financial',
    uiPriority: 'informational',
    severity: 'INFO' as NotificationSeverity,
    title: 'T',
    body: 'B',
    createdAt: new Date().toISOString(),
    readAt: null,
    inAttentionQueue: true,
    suppressed: false,
    relatedEntityType: null,
    relatedEntityId: null,
    actions: [],
    trust: { why: 'w', recommendedNextStep: 'r' },
    dedupeKey: null,
    explainability: stubOperationalExplainability(partial.id),
    ...partial,
  };
}

describe('priority-engine', () => {
  it('dedupes alerts that share dedupeKey and keeps higher severity', () => {
    const a = mockAlert({
      id: '1',
      dedupeKey: 'risk:PROJECTED_LOW_BALANCE',
      severity: 'WARNING' as NotificationSeverity,
      domain: 'financial',
    });
    const b = mockAlert({
      id: '2',
      dedupeKey: 'risk:PROJECTED_LOW_BALANCE',
      severity: 'CRITICAL' as NotificationSeverity,
      domain: 'guidance',
    });
    const out = dedupeOperationalAlerts([a, b]);
    expect(out.map(x => x.id).sort()).toEqual(['2']);
  });

  it('pickAlertWinner prefers guidance on severity tie', () => {
    const a = mockAlert({
      id: '1',
      severity: 'WARNING' as NotificationSeverity,
      domain: 'financial',
    });
    const b = mockAlert({
      id: '2',
      severity: 'WARNING' as NotificationSeverity,
      domain: 'guidance',
    });
    expect(pickAlertWinner(a, b).id).toBe('2');
  });

  it('ranks attention queue and contractor invoice boosts', () => {
    const inv = mockAlert({
      id: 'inv',
      domain: 'invoice',
      inAttentionQueue: true,
      severity: 'WARNING' as NotificationSeverity,
    });
    const fin = mockAlert({
      id: 'fin',
      domain: 'financial',
      inAttentionQueue: true,
      severity: 'WARNING' as NotificationSeverity,
    });
    const ranked = rankOperationalAlerts([fin, inv], { incomeProfileTypes: ['CONTRACTOR'] });
    expect(ranked[0].id).toBe('inv');
  });
});
