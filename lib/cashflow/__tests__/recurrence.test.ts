import { FinancialTransactionDirection } from '@prisma/client';
import { buildRecurringSeriesKey, inferCadenceFromMedianDays } from '@/lib/cashflow/recurrence';

describe('inferCadenceFromMedianDays', () => {
  it('classifies weekly and monthly intervals', () => {
    expect(inferCadenceFromMedianDays(7)).toBe('weekly');
    expect(inferCadenceFromMedianDays(30)).toBe('monthly');
    expect(inferCadenceFromMedianDays(14)).toBe('biweekly');
    expect(inferCadenceFromMedianDays(90)).toBe('quarterly');
    expect(inferCadenceFromMedianDays(2)).toBe('unknown');
  });
});

describe('buildRecurringSeriesKey', () => {
  it('drops generic stop tokens and prefixes the direction', () => {
    // "pay" is a stop token now — the improved fingerprint keys on the merchant
    // anchor "acme" only, so "Acme Pay" matches "Acme Pay LLC" and "Acme Pay #042".
    const k = buildRecurringSeriesKey(FinancialTransactionDirection.INFLOW, {
      merchantName: '  ACME   Pay  ',
      description: 'x',
    });
    expect(k).toBe('INFLOW:acme');
  });

  it('groups Venmo payments from the same person regardless of reference numbers', () => {
    const a = buildRecurringSeriesKey(FinancialTransactionDirection.INFLOW, {
      merchantName: null,
      description: 'VENMO PMT 12345 JOHN DOE',
    });
    const b = buildRecurringSeriesKey(FinancialTransactionDirection.INFLOW, {
      merchantName: null,
      description: 'Venmo payment 67890 John Doe',
    });
    expect(a).toBe(b);
    expect(a).toMatch(/^INFLOW:venmo:/);
  });

  it('groups Starbucks receipts despite store numbers', () => {
    const a = buildRecurringSeriesKey(FinancialTransactionDirection.OUTFLOW, {
      merchantName: null,
      description: 'STARBUCKS #1234 SAN FRANCISCO',
    });
    const b = buildRecurringSeriesKey(FinancialTransactionDirection.OUTFLOW, {
      merchantName: 'STARBUCKS COFFEE #6042',
      description: 'starbucks',
    });
    expect(a).toBe(b);
  });
});
