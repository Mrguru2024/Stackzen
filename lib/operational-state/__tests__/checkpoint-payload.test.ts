import { mergeOperationalCheckpoint } from '@/lib/operational-state/checkpoint-payload';

describe('mergeOperationalCheckpoint', () => {
  it('merges moneyControl and preserves prior workspace', () => {
    const next = mergeOperationalCheckpoint(
      { version: 1, workspace: { focusAlertId: 'clxxx' } },
      { moneyControl: { tab: 'review', financialTransactionId: 'cltx1234567890123456789012' } }
    );
    expect(next.version).toBe(1);
    expect(next.moneyControl?.tab).toBe('review');
    expect(next.moneyControl?.financialTransactionId).toBe('cltx1234567890123456789012');
    expect(next.workspace?.focusAlertId).toBe('clxxx');
  });
});
