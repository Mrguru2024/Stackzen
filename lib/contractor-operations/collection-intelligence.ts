import { addDays, differenceInCalendarDays } from 'date-fns';
import type { LatePayerClientDto } from '@/lib/contractor-operations/types';

/**
 * Open invoices only: groups overdue rows by clientId.
 * Weighted average lateness = Σ(amount × daysPastDue) / Σ(amount).
 */
export function summarizeLatePayersByClient(
  rows: { clientId: string; invoiceId: string; amount: number; daysPastDue: number | null }[]
): LatePayerClientDto[] {
  type Agg = { wSum: number; amtSum: number; count: number; ids: string[] };
  const map = new Map<string, Agg>();
  for (const r of rows) {
    if (r.daysPastDue == null || r.daysPastDue <= 0) continue;
    const amt = Math.max(0, r.amount);
    const cur = map.get(r.clientId) ?? { wSum: 0, amtSum: 0, count: 0, ids: [] };
    cur.wSum += amt * r.daysPastDue;
    cur.amtSum += amt;
    cur.count += 1;
    if (cur.ids.length < 10) cur.ids.push(r.invoiceId);
    map.set(r.clientId, cur);
  }
  const out: LatePayerClientDto[] = [];
  for (const [clientId, v] of map) {
    if (v.amtSum <= 0) continue;
    out.push({
      clientId,
      openOverdueCount: v.count,
      openOverdueUsd: v.amtSum,
      weightedAvgDaysPastDue: v.wSum / v.amtSum,
      invoiceIds: v.ids,
    });
  }
  return out.sort((a, b) => b.openOverdueUsd - a.openOverdueUsd);
}

export interface CollectionTimingSpreadDto {
  upcomingWithinWindowCount: number;
  meanDaysUntilDue: number | null;
  stdevDaysUntilDue: number | null;
  reasoning: string[];
}

/**
 * Spread of due dates for open invoices due in (today, today+windowDays] — higher stdev ⇒ more staggered near-term collection timing.
 */
export function summarizeUpcomingDueSpread(
  rows: { dueDate: Date }[],
  now: Date,
  windowDays: number
): CollectionTimingSpreadDto {
  const end = addDays(now, windowDays);
  const daysList: number[] = [];
  for (const r of rows) {
    if (r.dueDate <= now || r.dueDate > end) continue;
    daysList.push(differenceInCalendarDays(r.dueDate, now));
  }
  const n = daysList.length;
  if (n === 0) {
    return {
      upcomingWithinWindowCount: 0,
      meanDaysUntilDue: null,
      stdevDaysUntilDue: null,
      reasoning: [
        `No unpaid invoices with due dates in the next ${windowDays} calendar days (local day comparison).`,
      ],
    };
  }
  const mean = daysList.reduce((a, b) => a + b, 0) / n;
  const variance = daysList.reduce((acc, d) => acc + (d - mean) ** 2, 0) / n;
  const stdev = Math.sqrt(variance);
  return {
    upcomingWithinWindowCount: n,
    meanDaysUntilDue: mean,
    stdevDaysUntilDue: stdev,
    reasoning: [
      `Unpaid invoices with dueDate in (today, today+${windowDays}] only.`,
      'Mean and population stdev of calendar days-until-due are deterministic from those rows.',
    ],
  };
}
