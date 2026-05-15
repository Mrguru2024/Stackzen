import { addDays, addMonths, addYears } from 'date-fns';
import { createHash } from 'node:crypto';
import type { CashflowEventDto } from '@/lib/cashflow/types';
import type {
  ObligationClusterDto,
  TimingCalendarEntryDto,
  TimingCalendarEntryKind,
} from '@/lib/timing-coordination/types';

function ymd(date: string | Date): string {
  return (typeof date === 'string' ? date : date.toISOString()).slice(0, 10);
}

function entryId(parts: string[]): string {
  return createHash('sha256').update(parts.join('|'), 'utf8').digest('hex').slice(0, 12);
}

function directionForKind(
  kind: TimingCalendarEntryKind,
  fallback: 'INFLOW' | 'OUTFLOW' | undefined
): TimingCalendarEntryDto['direction'] {
  if (kind === 'goal_target') return 'NEUTRAL';
  if (kind === 'invoice_due') return 'INFLOW';
  return fallback ?? 'NEUTRAL';
}

type RecurringBillFrequency = 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly' | 'unknown';

function normalizeFrequency(value: string | null | undefined): RecurringBillFrequency {
  if (!value) return 'monthly';
  const s = value.toLowerCase();
  if (s.includes('week') && s.includes('bi')) return 'biweekly';
  if (s === 'biweekly' || s === 'bi-weekly' || s === 'fortnightly') return 'biweekly';
  if (s.includes('week')) return 'weekly';
  if (s.includes('quarter')) return 'quarterly';
  if (s.includes('year') || s === 'annually') return 'yearly';
  if (s.includes('month')) return 'monthly';
  return 'unknown';
}

function roll(date: Date, freq: RecurringBillFrequency, direction: 1 | -1): Date {
  switch (freq) {
    case 'weekly':
      return addDays(date, 7 * direction);
    case 'biweekly':
      return addDays(date, 14 * direction);
    case 'monthly':
      return addMonths(date, 1 * direction);
    case 'quarterly':
      return addMonths(date, 3 * direction);
    case 'yearly':
      return addYears(date, 1 * direction);
    default:
      return addMonths(date, 1 * direction);
  }
}

/**
 * Pure: enumerate every occurrence of a recurring bill that falls in [rangeStart, rangeEnd] inclusive,
 * starting from the bill's known `nextDueDate`. Rolls backwards/forwards as needed.
 *
 * Guarded with a hard iteration ceiling (366 steps in each direction) so a
 * pathological row cannot ever produce an unbounded loop.
 */
export function enumerateRecurringBillOccurrences(
  bill: { nextDueDate: Date | string; frequency: string },
  rangeStart: Date,
  rangeEnd: Date
): Date[] {
  if (rangeEnd < rangeStart) return [];
  const freq = normalizeFrequency(bill.frequency);
  let cur = new Date(typeof bill.nextDueDate === 'string' ? bill.nextDueDate : bill.nextDueDate.toISOString());
  for (let i = 0; i < 366 && cur > rangeStart; i++) {
    cur = roll(cur, freq, -1);
  }
  while (cur < rangeStart) {
    cur = roll(cur, freq, 1);
  }
  const out: Date[] = [];
  for (let i = 0; i < 366 && cur <= rangeEnd; i++) {
    out.push(new Date(cur));
    cur = roll(cur, freq, 1);
  }
  return out;
}

export interface BuildCalendarEntriesInput {
  /** 30-day forecast events only (do not pass the 7/14 windows). */
  forecastEvents30d: CashflowEventDto[];
  goalTargets: { goalId: string; name: string; targetDate: string }[];
  invoiceRows: { id: string; number: string; status: string; dueDate: string; amount: number }[];
  recurringBillIds: Set<string>;
  clusters: ObligationClusterDto[];
}

/**
 * Deterministic projection of forecast + invoice + goal-target rows onto calendar
 * entries. Uses ONLY the 30-day forecast window to avoid the 7/14/30 dedupe trap.
 */
export function buildCalendarEntries(input: BuildCalendarEntriesInput): TimingCalendarEntryDto[] {
  const clusterById = new Map(input.clusters.map(c => [c.id, c]));
  const dayToClusterId = new Map<string, string>();
  for (const c of input.clusters) {
    const start = new Date(c.startDate);
    const end = new Date(c.endDate);
    for (
      let d = new Date(start);
      d <= end;
      d.setUTCDate(d.getUTCDate() + 1)
    ) {
      dayToClusterId.set(ymd(d), c.id);
    }
  }

  const seen = new Set<string>();
  const out: TimingCalendarEntryDto[] = [];

  for (const e of input.forecastEvents30d) {
    const day = ymd(e.date);
    const primaryRef = e.referenceIds[0] ?? e.label;
    const id = entryId([e.kind, primaryRef, day]);
    if (seen.has(id)) continue;
    seen.add(id);
    const shiftable = e.kind === 'recurring_bill' && input.recurringBillIds.has(e.referenceIds[0] ?? '');
    const clusterId = dayToClusterId.get(day) ?? null;
    out.push({
      id,
      date: day,
      kind: e.kind,
      direction: e.direction,
      label: e.label,
      amountUsd: Number(e.amount.toFixed(2)),
      referenceIds: e.referenceIds.slice(0, 3),
      clusterId,
      shiftable,
      reasoning: [
        `Forecast event of kind ${e.kind} on ${day}.`,
        clusterId ? `Falls inside cluster ${clusterId}.` : 'Not part of a flagged cluster.',
        shiftable
          ? 'Recurring-bill row — drag-and-drop creates a SHIFT_RECURRING_BILL_DATE proposal (user-approved).'
          : 'Not user-shiftable from the calendar.',
      ],
    });
  }

  for (const inv of input.invoiceRows) {
    const day = ymd(inv.dueDate);
    const id = entryId(['invoice_due', inv.id, day]);
    if (seen.has(id)) continue;
    seen.add(id);
    out.push({
      id,
      date: day,
      kind: 'invoice_due',
      direction: directionForKind('invoice_due', undefined),
      label: `Invoice ${inv.number} (${inv.status})`,
      amountUsd: Number(inv.amount.toFixed(2)),
      referenceIds: [inv.id],
      clusterId: null,
      shiftable: false,
      reasoning: [
        `Invoice ${inv.number} due on ${day} (status ${inv.status}).`,
        'Calendar projects dueDate; status changes flow through invoices, not from the calendar.',
      ],
    });
  }

  for (const g of input.goalTargets) {
    const day = ymd(g.targetDate);
    const id = entryId(['goal_target', g.goalId, day]);
    if (seen.has(id)) continue;
    seen.add(id);
    out.push({
      id,
      date: day,
      kind: 'goal_target',
      direction: directionForKind('goal_target', undefined),
      label: `Goal target · ${g.name}`,
      amountUsd: null,
      referenceIds: [g.goalId],
      clusterId: null,
      shiftable: false,
      reasoning: [
        `OperationalGoal target date is ${day}.`,
        'To change, use the EXTEND_GOAL_TARGET_DATE operational action — never from drag-drop.',
      ],
    });
  }

  out.sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? -1 : 1;
    if (a.label !== b.label) return a.label < b.label ? -1 : 1;
    return a.id < b.id ? -1 : 1;
  });

  // Mark cluster ids that exist in the entry set so the UI can render cluster
  // strokes for entries that don't otherwise know they belong to one.
  for (const entry of out) {
    if (entry.clusterId && !clusterById.has(entry.clusterId)) {
      entry.clusterId = null;
    }
  }

  return out;
}
