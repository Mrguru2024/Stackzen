import { differenceInCalendarDays } from 'date-fns';
import { createHash } from 'node:crypto';
import type { CashflowEventDto, DailyBalancePointDto } from '@/lib/cashflow/types';
import type {
  ForecastInstabilityWindowDto,
  ObligationClusterDto,
  PayoutBillConflictDto,
} from '@/lib/timing-coordination/types';

export const DEFAULT_BAND_DAYS = 5;
export const DEFAULT_MIN_CLUSTER_SIZE = 3;
export const DEFAULT_MIN_CLUSTER_AMOUNT_USD = 200;
export const DEFAULT_MAX_CLUSTERS_REPORTED = 5;
export const DEFAULT_CONFLICT_WINDOW_DAYS = 14;
export const DEFAULT_MIN_CONFLICT_DEFICIT_USD = 100;
export const DEFAULT_INSTABILITY_FRACTION = 0.25;
export const DEFAULT_MIN_INSTABILITY_DAYS = 3;

const OUTFLOW_KINDS: ReadonlySet<CashflowEventDto['kind']> = new Set([
  'recurring_bill',
  'detected_obligation',
]);

function shortHash(parts: string[]): string {
  return createHash('sha256').update(parts.join('|'), 'utf8').digest('hex').slice(0, 12);
}

function ymd(date: string): string {
  return date.slice(0, 10);
}

export interface DetectObligationClustersOptions {
  minSize?: number;
  bandDays?: number;
  minAmountUsd?: number;
  max?: number;
  /** Optional starting balance used to mark clusters as `dense` (totalAmount > balance × 0.30). */
  startingBalance?: number;
}

/**
 * Pure: detect outflow obligation clusters from forecast events. Deterministic;
 * stable sort and tie-breaks. Does not look at transactions directly — clustering
 * is *projection-level*, not history-level (see audit §10).
 */
export function detectObligationClusters(
  events: CashflowEventDto[],
  opts: DetectObligationClustersOptions = {}
): ObligationClusterDto[] {
  const minSize = opts.minSize ?? DEFAULT_MIN_CLUSTER_SIZE;
  const bandDays = opts.bandDays ?? DEFAULT_BAND_DAYS;
  const minAmount = opts.minAmountUsd ?? DEFAULT_MIN_CLUSTER_AMOUNT_USD;
  const max = opts.max ?? DEFAULT_MAX_CLUSTERS_REPORTED;
  const startingBalance = opts.startingBalance ?? 0;

  const outflows = events
    .filter(e => OUTFLOW_KINDS.has(e.kind) && Number.isFinite(e.amount) && e.amount > 0)
    .slice()
    .sort((a, b) => {
      const da = ymd(a.date);
      const db = ymd(b.date);
      if (da !== db) return da < db ? -1 : 1;
      return a.label < b.label ? -1 : a.label > b.label ? 1 : 0;
    });

  const out: ObligationClusterDto[] = [];

  for (let i = 0; i < outflows.length; i++) {
    if (out.length >= max) break;
    const start = outflows[i];
    const startDay = new Date(start.date);
    let total = 0;
    const events: typeof outflows = [];
    let lastIncludedDate = start.date;

    for (let j = i; j < outflows.length; j++) {
      const e = outflows[j];
      const diff = differenceInCalendarDays(new Date(e.date), startDay);
      if (diff < 0 || diff >= bandDays) break;
      events.push(e);
      total += e.amount;
      lastIncludedDate = e.date;
    }

    if (events.length >= minSize && total >= minAmount) {
      const id = shortHash([
        ymd(start.date),
        ymd(lastIncludedDate),
        events.map(e => e.label).join('+'),
      ]);
      const dense = startingBalance > 0 ? total > startingBalance * 0.3 : false;
      out.push({
        id,
        startDate: ymd(start.date),
        endDate: ymd(lastIncludedDate),
        bandDays: differenceInCalendarDays(new Date(lastIncludedDate), startDay) + 1,
        totalAmountUsd: Number(total.toFixed(2)),
        dense,
        events: events.map(e => ({
          date: ymd(e.date),
          amountUsd: Number(e.amount.toFixed(2)),
          label: e.label,
          kind: e.kind,
          referenceIds: e.referenceIds.slice(0, 3),
        })),
        reasoning: [
          `${events.length} outflow events between ${ymd(start.date)} and ${ymd(lastIncludedDate)} sum to $${total.toFixed(2)}.`,
          `Cluster band is ${bandDays} days; minimum size is ${minSize}; minimum amount is $${minAmount.toFixed(2)}.`,
          dense
            ? `Cluster total > 30% of projected starting balance ($${startingBalance.toFixed(2)}) — dense.`
            : startingBalance > 0
              ? `Cluster total ≤ 30% of projected starting balance — not flagged dense.`
              : 'Starting balance not provided to clustering — dense flag suppressed.',
        ],
      });
      i = outflows.indexOf(events[events.length - 1]);
    }
  }

  return out;
}

export interface DetectPayoutBillConflictsOptions {
  windowDays?: number;
  minDeficitUsd?: number;
}

export function detectPayoutBillConflicts(
  events: CashflowEventDto[],
  opts: DetectPayoutBillConflictsOptions = {}
): PayoutBillConflictDto[] {
  const windowDays = opts.windowDays ?? DEFAULT_CONFLICT_WINDOW_DAYS;
  const minDeficit = opts.minDeficitUsd ?? DEFAULT_MIN_CONFLICT_DEFICIT_USD;

  if (events.length === 0) return [];

  const dayMap = new Map<string, { inflow: number; outflow: number }>();
  for (const e of events) {
    const day = ymd(e.date);
    const cur = dayMap.get(day) ?? { inflow: 0, outflow: 0 };
    if (e.direction === 'INFLOW') cur.inflow += e.amount;
    else if (e.direction === 'OUTFLOW') cur.outflow += e.amount;
    dayMap.set(day, cur);
  }

  const days = Array.from(dayMap.keys()).sort();
  const firstDay = days[0];
  if (!firstDay) return [];
  const firstDate = new Date(firstDay);

  let cumulativeInflow = 0;
  let cumulativeOutflow = 0;
  const out: PayoutBillConflictDto[] = [];

  for (const day of days) {
    const diff = differenceInCalendarDays(new Date(day), firstDate);
    if (diff >= windowDays) break;
    const d = dayMap.get(day)!;
    cumulativeInflow += d.inflow;
    cumulativeOutflow += d.outflow;
    const deficit = cumulativeOutflow - cumulativeInflow;
    if (deficit >= minDeficit) {
      out.push({
        date: day,
        deficitUsd: Number(deficit.toFixed(2)),
        precedingInflowUsd: Number(cumulativeInflow.toFixed(2)),
        outflowOnDayUsd: Number(d.outflow.toFixed(2)),
        reasoning: [
          `Cumulative outflow ($${cumulativeOutflow.toFixed(2)}) exceeds cumulative inflow ($${cumulativeInflow.toFixed(2)}) by $${deficit.toFixed(2)} on ${day}.`,
          `Conflict window is ${windowDays} days; minimum deficit threshold is $${minDeficit.toFixed(2)}.`,
        ],
      });
    }
  }

  out.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : b.deficitUsd - a.deficitUsd));
  return out;
}

export interface DetectInstabilityWindowOptions {
  startingBalance: number;
  instabilityFraction?: number;
  minDays?: number;
}

/**
 * Longest consecutive run of forecast days where projected balance is below
 * `startingBalance × instabilityFraction`. Returns null when no qualifying window
 * exists or when starting balance is non-positive.
 */
export function detectInstabilityWindow(
  daily: DailyBalancePointDto[] | undefined,
  opts: DetectInstabilityWindowOptions
): ForecastInstabilityWindowDto | null {
  if (!daily || daily.length === 0) return null;
  if (!Number.isFinite(opts.startingBalance) || opts.startingBalance <= 0) return null;

  const fraction = opts.instabilityFraction ?? DEFAULT_INSTABILITY_FRACTION;
  const minDays = opts.minDays ?? DEFAULT_MIN_INSTABILITY_DAYS;
  const threshold = opts.startingBalance * fraction;

  let bestStart: string | null = null;
  let bestEnd: string | null = null;
  let bestLength = 0;
  let curStart: string | null = null;
  let curLength = 0;

  for (const point of daily) {
    if (point.balance < threshold) {
      if (curStart === null) {
        curStart = ymd(point.date);
        curLength = 1;
      } else {
        curLength += 1;
      }
      if (curLength > bestLength) {
        bestLength = curLength;
        bestStart = curStart;
        bestEnd = ymd(point.date);
      }
    } else {
      curStart = null;
      curLength = 0;
    }
  }

  if (bestLength < minDays || !bestStart || !bestEnd) return null;

  return {
    startDate: bestStart,
    endDate: bestEnd,
    daysCount: bestLength,
    thresholdUsd: Number(threshold.toFixed(2)),
    reasoning: [
      `Projected balance stayed below $${threshold.toFixed(2)} (${(fraction * 100).toFixed(0)}% of starting balance) for ${bestLength} consecutive days.`,
      `Minimum window is ${minDays} day(s); window is taken from the 30-day daily series only.`,
    ],
  };
}
