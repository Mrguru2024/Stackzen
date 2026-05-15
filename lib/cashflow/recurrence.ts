import type { FinancialTransaction } from '@prisma/client';
import { FinancialTransactionDirection } from '@prisma/client';
import { addDays, addMonths } from 'date-fns';
import { isTransferDescription } from '@/lib/financial-automation/transactions';
import {
  formatMerchantDisplay,
  recognizeMemo,
} from '@/lib/financial-automation/memo-recognition';
import type { CadenceKind, DetectedSeriesDto } from '@/lib/cashflow/types';

/**
 * Stable grouping key for recurrence + income concentration.
 *
 * Delegates to `recognizeMemo` so noisy bank descriptions ("VENMO PMT 12345 JOHN",
 * "STARBUCKS #6042", "ACH CREDIT EMPLOYER PAYROLL 0042") collapse to one key per
 * real-world payer instead of splitting into many one-off rows.
 */
export function buildRecurringSeriesKey(
  direction: FinancialTransactionDirection,
  tx: Pick<FinancialTransaction, 'merchantName' | 'description'>
): string {
  const recognized = recognizeMemo({
    merchantName: tx.merchantName ?? null,
    description: tx.description ?? null,
  });
  return `${direction}:${recognized.groupKey}`;
}

/** Human-friendly label for a transaction, sharing the same normalization as the group key. */
export function humanLabelFor(
  tx: Pick<FinancialTransaction, 'merchantName' | 'description'>
): string {
  return formatMerchantDisplay({
    merchantName: tx.merchantName ?? null,
    description: tx.description ?? null,
  });
}

function median(nums: number[]): number {
  if (nums.length === 0) return 0;
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

function medianAbsoluteDeviation(intervals: number[]): number {
  const med = median(intervals);
  const devs = intervals.map(i => Math.abs(i - med));
  return median(devs);
}

export function inferCadenceFromMedianDays(days: number): CadenceKind {
  if (days >= 6 && days <= 8) return 'weekly';
  if (days >= 13 && days <= 15) return 'biweekly';
  if (days >= 27 && days <= 33) return 'monthly';
  if (days >= 85 && days <= 95) return 'quarterly';
  return 'unknown';
}

function nextCadenceDate(from: Date, cadence: CadenceKind): Date {
  switch (cadence) {
    case 'weekly':
      return addDays(from, 7);
    case 'biweekly':
      return addDays(from, 14);
    case 'monthly':
      return addMonths(from, 1);
    case 'quarterly':
      return addMonths(from, 3);
    default:
      return addMonths(from, 1);
  }
}

function rollForwardNext(from: Date, cadence: CadenceKind, notBefore: Date): Date {
  let d = new Date(from);
  let guard = 0;
  while (d < notBefore && guard < 120) {
    d = nextCadenceDate(d, cadence === 'unknown' ? 'monthly' : cadence);
    guard += 1;
  }
  return d;
}

function detectSeriesForDirection(
  rows: FinancialTransaction[],
  direction: FinancialTransactionDirection,
  now: Date
): DetectedSeriesDto[] {
  const filtered = rows.filter(
    t =>
      t.direction === direction &&
      !isTransferDescription(t.description) &&
      Math.abs(t.amount) > 0
  );

  const groups = new Map<
    string,
    {
      label: string;
      txs: FinancialTransaction[];
    }
  >();

  for (const tx of filtered) {
    const key = buildRecurringSeriesKey(direction, tx);
    const cur = groups.get(key);
    const label = humanLabelFor(tx);
    if (!cur) groups.set(key, { label: label.slice(0, 80), txs: [tx] });
    else cur.txs.push(tx);
  }

  const out: DetectedSeriesDto[] = [];

  for (const [key, g] of groups) {
    if (g.txs.length < 3) continue;

    const sorted = [...g.txs].sort((a, b) => a.postedAt.getTime() - b.postedAt.getTime());
    const intervals: number[] = [];
    for (let i = 1; i < sorted.length; i++) {
      const days =
        (sorted[i].postedAt.getTime() - sorted[i - 1].postedAt.getTime()) / (86400 * 1000);
      if (days >= 1 && days <= 120) intervals.push(days);
    }
    if (intervals.length < 2) continue;

    const medianInterval = median(intervals);
    const mad = medianAbsoluteDeviation(intervals);
    const stability = Math.max(0, 1 - Math.min(1, mad / Math.max(medianInterval, 1)));
    const cadence = inferCadenceFromMedianDays(medianInterval);

    if (cadence === 'unknown') continue;

    const amounts = sorted.map(t => Math.abs(t.amount));
    const medianAmount = median(amounts);

    const confidence = Math.min(1, sorted.length / 10) * stability;

    const lastPosted = sorted[sorted.length - 1].postedAt;
    const nextSeed = nextCadenceDate(lastPosted, cadence);
    const nextExpected = rollForwardNext(nextSeed, cadence, now);

    const sampleIds = sorted
      .slice(-5)
      .map(t => t.id)
      .reverse();

    out.push({
      key,
      direction: direction === FinancialTransactionDirection.INFLOW ? 'INFLOW' : 'OUTFLOW',
      label: g.label,
      medianAmount,
      cadence,
      medianIntervalDays: medianInterval,
      occurrences: sorted.length,
      confidence,
      sampleTransactionIds: sampleIds,
      nextExpectedDate: nextExpected.toISOString(),
    });
  }

  return out.sort((a, b) => b.confidence - a.confidence).slice(0, 40);
}

export function detectRecurringPatterns(rows: FinancialTransaction[], now: Date = new Date()) {
  return {
    obligations: detectSeriesForDirection(rows, FinancialTransactionDirection.OUTFLOW, now),
    income: detectSeriesForDirection(rows, FinancialTransactionDirection.INFLOW, now),
  };
}
