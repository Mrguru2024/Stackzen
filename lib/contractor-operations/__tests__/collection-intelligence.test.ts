import {
  summarizeLatePayersByClient,
  summarizeUpcomingDueSpread,
} from '@/lib/contractor-operations/collection-intelligence';

describe('summarizeLatePayersByClient', () => {
  it('aggregates overdue open AR by client with amount-weighted avg days past due', () => {
    const out = summarizeLatePayersByClient([
      { clientId: 'a', invoiceId: 'i1', amount: 100, daysPastDue: 5 },
      { clientId: 'a', invoiceId: 'i2', amount: 100, daysPastDue: 15 },
      { clientId: 'b', invoiceId: 'i3', amount: 50, daysPastDue: 2 },
      { clientId: 'c', invoiceId: 'i4', amount: 200, daysPastDue: null },
      { clientId: 'd', invoiceId: 'i5', amount: 10, daysPastDue: 0 },
    ]);
    expect(out).toHaveLength(2);
    expect(out[0].clientId).toBe('a');
    expect(out[0].openOverdueUsd).toBe(200);
    expect(out[0].openOverdueCount).toBe(2);
    expect(out[0].weightedAvgDaysPastDue).toBe(10);
    expect(out[1].clientId).toBe('b');
    expect(out[1].weightedAvgDaysPastDue).toBe(2);
  });

  it('sorts by open overdue USD descending', () => {
    const out = summarizeLatePayersByClient([
      { clientId: 'low', invoiceId: '1', amount: 10, daysPastDue: 100 },
      { clientId: 'high', invoiceId: '2', amount: 500, daysPastDue: 1 },
    ]);
    expect(out[0].clientId).toBe('high');
    expect(out[1].clientId).toBe('low');
  });
});

describe('summarizeUpcomingDueSpread', () => {
  const anchor = new Date('2026-03-01T12:00:00Z');

  it('returns empty stats when no invoices in window', () => {
    const spread = summarizeUpcomingDueSpread(
      [{ dueDate: new Date('2026-03-01T08:00:00Z') }, { dueDate: new Date('2026-03-20T08:00:00Z') }],
      anchor,
      14
    );
    expect(spread.upcomingWithinWindowCount).toBe(0);
    expect(spread.meanDaysUntilDue).toBeNull();
  });

  it('counts only strictly future due dates within window', () => {
    const spread = summarizeUpcomingDueSpread(
      [
        { dueDate: new Date('2026-03-02T08:00:00Z') },
        { dueDate: new Date('2026-03-05T08:00:00Z') },
        { dueDate: new Date('2026-03-16T08:00:00Z') },
      ],
      anchor,
      14
    );
    expect(spread.upcomingWithinWindowCount).toBe(2);
    expect(spread.meanDaysUntilDue).toBeCloseTo(2.5, 5);
    expect(spread.stdevDaysUntilDue).toBeCloseTo(1.5, 5);
  });
});
