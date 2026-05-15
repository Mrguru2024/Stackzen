import { enumerateRecurringBillOccurrences } from '@/lib/timing-coordination/calendar-entries';

describe('enumerateRecurringBillOccurrences', () => {
  it('returns empty for inverted range', () => {
    const out = enumerateRecurringBillOccurrences(
      { nextDueDate: new Date('2026-06-01T00:00:00.000Z'), frequency: 'monthly' },
      new Date('2026-06-30T00:00:00.000Z'),
      new Date('2026-06-01T00:00:00.000Z')
    );
    expect(out).toEqual([]);
  });

  it('enumerates monthly occurrences within a 4-month window', () => {
    const out = enumerateRecurringBillOccurrences(
      { nextDueDate: new Date('2026-06-15T00:00:00.000Z'), frequency: 'monthly' },
      new Date('2026-05-01T00:00:00.000Z'),
      new Date('2026-08-31T00:00:00.000Z')
    );
    const dates = out.map(d => d.toISOString().slice(0, 10));
    expect(dates).toEqual(['2026-05-15', '2026-06-15', '2026-07-15', '2026-08-15']);
  });

  it('enumerates biweekly occurrences within a 6-week window', () => {
    const out = enumerateRecurringBillOccurrences(
      { nextDueDate: new Date('2026-06-04T00:00:00.000Z'), frequency: 'biweekly' },
      new Date('2026-06-01T00:00:00.000Z'),
      new Date('2026-07-15T00:00:00.000Z')
    );
    const dates = out.map(d => d.toISOString().slice(0, 10));
    expect(dates).toEqual(['2026-06-04', '2026-06-18', '2026-07-02']);
  });

  it('rolls backwards when the bill anchor is in the future', () => {
    const out = enumerateRecurringBillOccurrences(
      { nextDueDate: new Date('2027-01-15T00:00:00.000Z'), frequency: 'monthly' },
      new Date('2026-11-01T00:00:00.000Z'),
      new Date('2026-12-31T00:00:00.000Z')
    );
    const dates = out.map(d => d.toISOString().slice(0, 10));
    expect(dates).toEqual(['2026-11-15', '2026-12-15']);
  });

  it('treats unknown / missing frequencies as monthly', () => {
    const out = enumerateRecurringBillOccurrences(
      { nextDueDate: new Date('2026-06-15T00:00:00.000Z'), frequency: '' },
      new Date('2026-06-01T00:00:00.000Z'),
      new Date('2026-08-31T00:00:00.000Z')
    );
    const dates = out.map(d => d.toISOString().slice(0, 10));
    expect(dates).toEqual(['2026-06-15', '2026-07-15', '2026-08-15']);
  });

  it('supports yearly recurrences', () => {
    const out = enumerateRecurringBillOccurrences(
      { nextDueDate: new Date('2025-03-10T00:00:00.000Z'), frequency: 'yearly' },
      new Date('2026-01-01T00:00:00.000Z'),
      new Date('2028-12-31T00:00:00.000Z')
    );
    const dates = out.map(d => d.toISOString().slice(0, 10));
    expect(dates).toEqual(['2026-03-10', '2027-03-10', '2028-03-10']);
  });
});
