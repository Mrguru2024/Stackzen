import type { CashflowEventDto } from '@/lib/cashflow/types';
import { buildCalendarEntries } from '@/lib/timing-coordination/calendar-entries';
import type { ObligationClusterDto } from '@/lib/timing-coordination/types';

function fe(
  date: string,
  amount: number,
  direction: 'INFLOW' | 'OUTFLOW',
  kind: CashflowEventDto['kind'],
  label: string,
  refIds: string[] = []
): CashflowEventDto {
  return {
    date: `${date}T00:00:00.000Z`,
    amount,
    direction,
    kind,
    label,
    referenceIds: refIds,
  };
}

const cluster: ObligationClusterDto = {
  id: 'cl1',
  startDate: '2026-06-01',
  endDate: '2026-06-03',
  bandDays: 3,
  totalAmountUsd: 500,
  dense: true,
  events: [],
  reasoning: [],
};

describe('buildCalendarEntries', () => {
  it('emits one entry per forecast event with stable id and cluster tagging', () => {
    const entries = buildCalendarEntries({
      forecastEvents30d: [
        fe('2026-06-01', 200, 'OUTFLOW', 'recurring_bill', 'Rent', ['bill-1']),
        fe('2026-06-02', 100, 'OUTFLOW', 'detected_obligation', 'Streaming', ['tx-9']),
      ],
      goalTargets: [],
      invoiceRows: [],
      recurringBillIds: new Set(['bill-1']),
      clusters: [cluster],
    });
    expect(entries).toHaveLength(2);
    const rent = entries.find(e => e.label === 'Rent')!;
    expect(rent.shiftable).toBe(true);
    expect(rent.clusterId).toBe('cl1');
    const stream = entries.find(e => e.label === 'Streaming')!;
    expect(stream.shiftable).toBe(false);
    expect(stream.clusterId).toBe('cl1');
  });

  it('only marks RecurringBill ids as shiftable', () => {
    const entries = buildCalendarEntries({
      forecastEvents30d: [
        fe('2026-06-10', 100, 'OUTFLOW', 'recurring_bill', 'Phone', ['bill-x']),
      ],
      goalTargets: [],
      invoiceRows: [],
      recurringBillIds: new Set([]), // no live bill rows
      clusters: [],
    });
    expect(entries[0].shiftable).toBe(false);
  });

  it('includes invoice due dates and goal targets, never as shiftable', () => {
    const entries = buildCalendarEntries({
      forecastEvents30d: [],
      goalTargets: [{ goalId: 'goal-1', name: 'Tax Reserve', targetDate: '2026-06-30T00:00:00.000Z' }],
      invoiceRows: [
        {
          id: 'inv-1',
          number: 'INV-001',
          status: 'sent',
          dueDate: '2026-06-15T00:00:00.000Z',
          amount: 800,
        },
      ],
      recurringBillIds: new Set(),
      clusters: [],
    });
    const goal = entries.find(e => e.kind === 'goal_target');
    const invoice = entries.find(e => e.kind === 'invoice_due');
    expect(goal?.shiftable).toBe(false);
    expect(invoice?.shiftable).toBe(false);
    expect(invoice?.direction).toBe('INFLOW');
  });

  it('deduplicates events using (kind, primaryReferenceId, day)', () => {
    const entries = buildCalendarEntries({
      forecastEvents30d: [
        fe('2026-06-10', 100, 'OUTFLOW', 'recurring_bill', 'Phone', ['bill-x']),
        fe('2026-06-10', 100, 'OUTFLOW', 'recurring_bill', 'Phone', ['bill-x']),
      ],
      goalTargets: [],
      invoiceRows: [],
      recurringBillIds: new Set(['bill-x']),
      clusters: [],
    });
    expect(entries).toHaveLength(1);
  });

  it('sorts entries by date then label then id for determinism', () => {
    const entries = buildCalendarEntries({
      forecastEvents30d: [
        fe('2026-06-05', 100, 'OUTFLOW', 'recurring_bill', 'Z', ['z']),
        fe('2026-06-05', 50, 'OUTFLOW', 'recurring_bill', 'A', ['a']),
        fe('2026-06-04', 50, 'INFLOW', 'detected_income', 'P', ['p']),
      ],
      goalTargets: [],
      invoiceRows: [],
      recurringBillIds: new Set(),
      clusters: [],
    });
    expect(entries.map(e => `${e.date}|${e.label}`)).toEqual([
      '2026-06-04|P',
      '2026-06-05|A',
      '2026-06-05|Z',
    ]);
  });
});
