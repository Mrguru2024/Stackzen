import type { FinancialEntityType } from '@prisma/client';
import { buildOperationalDedupeKey } from '@/lib/operational-notifications/dedupe-key';

describe('buildOperationalDedupeKey', () => {
  it('uses guidance riskCode', () => {
    const k = buildOperationalDedupeKey(
      { guidance: { riskCode: 'PROJECTED_LOW_BALANCE' } },
      null,
      null
    );
    expect(k).toBe('risk:PROJECTED_LOW_BALANCE');
  });

  it('maps cashflow attentionKind to risk fingerprint', () => {
    const k = buildOperationalDedupeKey({ attentionKind: 'cashflow_projected_low_balance' }, null, null);
    expect(k).toBe('risk:PROJECTED_LOW_BALANCE');
  });

  it('falls back to related entity', () => {
    const k = buildOperationalDedupeKey({}, 'INVOICE' as FinancialEntityType, 'inv1');
    expect(k).toBe('entity:INVOICE:inv1');
  });
});
