import type { CashflowEventDto, DailyBalancePointDto } from '@/lib/cashflow/types';
import {
  detectInstabilityWindow,
  detectObligationClusters,
  detectPayoutBillConflicts,
} from '@/lib/timing-coordination/clusters';

function evt(
  date: string,
  amount: number,
  direction: 'INFLOW' | 'OUTFLOW',
  kind: CashflowEventDto['kind'] = 'recurring_bill',
  label = 'Bill'
): CashflowEventDto {
  return {
    date: `${date}T00:00:00.000Z`,
    amount,
    direction,
    kind,
    label,
    referenceIds: [`${kind}-${date}`],
  };
}

describe('detectObligationClusters', () => {
  it('returns an empty list when below thresholds', () => {
    const out = detectObligationClusters([
      evt('2026-06-01', 80, 'OUTFLOW'),
      evt('2026-06-02', 80, 'OUTFLOW'),
    ]);
    expect(out).toHaveLength(0);
  });

  it('detects a 5-day band cluster with ≥3 outflows summing ≥$200', () => {
    const out = detectObligationClusters(
      [
        evt('2026-06-01', 120, 'OUTFLOW', 'recurring_bill', 'Rent'),
        evt('2026-06-02', 80, 'OUTFLOW', 'recurring_bill', 'Electric'),
        evt('2026-06-04', 50, 'OUTFLOW', 'detected_obligation', 'Streaming'),
        evt('2026-06-10', 75, 'OUTFLOW', 'recurring_bill', 'Phone'),
      ],
      { startingBalance: 1000 }
    );
    expect(out).toHaveLength(1);
    expect(out[0].startDate).toBe('2026-06-01');
    expect(out[0].endDate).toBe('2026-06-04');
    expect(out[0].totalAmountUsd).toBeCloseTo(250);
    expect(out[0].events).toHaveLength(3);
    expect(out[0].dense).toBe(false);
  });

  it('marks a cluster as dense when total > 30% of starting balance', () => {
    const out = detectObligationClusters(
      [
        evt('2026-06-01', 200, 'OUTFLOW', 'recurring_bill', 'Rent'),
        evt('2026-06-02', 150, 'OUTFLOW', 'recurring_bill', 'Card'),
        evt('2026-06-03', 100, 'OUTFLOW', 'recurring_bill', 'Loan'),
      ],
      { startingBalance: 1000 }
    );
    expect(out[0].dense).toBe(true);
  });

  it('ignores INFLOW events', () => {
    const out = detectObligationClusters(
      [
        evt('2026-06-01', 1000, 'INFLOW', 'detected_income', 'Paycheck'),
        evt('2026-06-02', 80, 'OUTFLOW'),
      ],
      { startingBalance: 1000 }
    );
    expect(out).toHaveLength(0);
  });
});

describe('detectPayoutBillConflicts', () => {
  it('returns nothing when inflow keeps up with outflow', () => {
    const out = detectPayoutBillConflicts([
      evt('2026-06-01', 1000, 'INFLOW', 'detected_income', 'Pay'),
      evt('2026-06-02', 200, 'OUTFLOW'),
      evt('2026-06-03', 200, 'OUTFLOW'),
    ]);
    expect(out).toHaveLength(0);
  });

  it('flags a day when cumulative outflow exceeds cumulative inflow by ≥ $100', () => {
    const out = detectPayoutBillConflicts([
      evt('2026-06-01', 100, 'INFLOW', 'detected_income', 'Tip'),
      evt('2026-06-02', 300, 'OUTFLOW', 'recurring_bill', 'Rent'),
      evt('2026-06-03', 200, 'OUTFLOW'),
    ]);
    expect(out.length).toBeGreaterThanOrEqual(1);
    expect(out[0].date).toBe('2026-06-02');
    expect(out[0].deficitUsd).toBeCloseTo(200);
  });

  it('clamps to a 14-day window', () => {
    const events: CashflowEventDto[] = [
      evt('2026-06-01', 0, 'OUTFLOW'),
      evt('2026-06-20', 5000, 'OUTFLOW'),
    ];
    const out = detectPayoutBillConflicts(events);
    expect(out.every(c => c.date < '2026-06-15')).toBe(true);
  });
});

describe('detectInstabilityWindow', () => {
  const startingBalance = 1000;

  function balance(date: string, b: number): DailyBalancePointDto {
    return { date: `${date}T00:00:00.000Z`, balance: b };
  }

  it('returns null when starting balance is non-positive', () => {
    expect(detectInstabilityWindow([balance('2026-06-01', 10)], { startingBalance: 0 })).toBeNull();
    expect(detectInstabilityWindow([balance('2026-06-01', 10)], { startingBalance: -10 })).toBeNull();
  });

  it('returns null when no run is long enough', () => {
    const out = detectInstabilityWindow(
      [balance('2026-06-01', 100), balance('2026-06-02', 800), balance('2026-06-03', 100)],
      { startingBalance }
    );
    expect(out).toBeNull();
  });

  it('returns the longest run below the 25% threshold (default 3+ days)', () => {
    const out = detectInstabilityWindow(
      [
        balance('2026-06-01', 800),
        balance('2026-06-02', 100),
        balance('2026-06-03', 50),
        balance('2026-06-04', 200),
        balance('2026-06-05', 500),
      ],
      { startingBalance }
    );
    expect(out).not.toBeNull();
    expect(out!.startDate).toBe('2026-06-02');
    expect(out!.endDate).toBe('2026-06-04');
    expect(out!.daysCount).toBe(3);
    expect(out!.thresholdUsd).toBeCloseTo(250);
  });
});
