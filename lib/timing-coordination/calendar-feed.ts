import { addDays, differenceInCalendarDays } from 'date-fns';
import { OperationalGoalStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { buildCashFlowForecast } from '@/lib/cashflow/forecast';
import {
  buildCalendarEntries,
  enumerateRecurringBillOccurrences,
} from '@/lib/timing-coordination/calendar-entries';
import { detectObligationClusters } from '@/lib/timing-coordination/clusters';
import type {
  ObligationClusterDto,
  TimingCalendarEntryDto,
} from '@/lib/timing-coordination/types';

const MAX_WINDOW_DAYS = 366; // hard cap so a buggy client cannot enumerate forever
const MIN_WINDOW_DAYS = 1;

export interface CalendarFeedRangeInput {
  userId: string;
  from: Date;
  to: Date;
}

export interface CalendarFeedRangeResult {
  generatedAt: string;
  from: string;
  to: string;
  entries: TimingCalendarEntryDto[];
  clusters: ObligationClusterDto[];
}

function clampRange(from: Date, to: Date): { from: Date; to: Date } {
  let start = from;
  let end = to;
  if (end < start) {
    const tmp = start;
    start = end;
    end = tmp;
  }
  const diff = differenceInCalendarDays(end, start);
  if (diff < MIN_WINDOW_DAYS - 1) {
    end = addDays(start, MIN_WINDOW_DAYS - 1);
  }
  if (diff > MAX_WINDOW_DAYS) {
    end = addDays(start, MAX_WINDOW_DAYS);
  }
  return { from: start, to: end };
}

/**
 * Authoritative read path for the in-app calendar UI. Unlike the 30-day forecast
 * snapshot, this enumerates `RecurringBill`, `Invoice`, and `OperationalGoal` rows
 * for the **requested** date range so months outside the next-30 days still render.
 *
 * For the next ≤30 days it also overlays the forecast `detected_obligation` /
 * `detected_income` events (which include income/discretionary obligations the
 * `RecurringBill` table does not enumerate).
 */
export async function buildCalendarFeedForRange(
  input: CalendarFeedRangeInput
): Promise<CalendarFeedRangeResult> {
  const { from, to } = clampRange(input.from, input.to);
  const now = new Date();

  const [recurringBills, invoiceRows, goalTargets] = await Promise.all([
    prisma.recurringBill.findMany({
      where: { userId: input.userId, enabled: true },
      select: { id: true, name: true, amount: true, nextDueDate: true, frequency: true },
    }),
    prisma.invoice.findMany({
      where: {
        userId: input.userId,
        status: { notIn: ['paid', 'failed'] },
        dueDate: { gte: from, lte: to },
      },
      select: { id: true, number: true, status: true, dueDate: true, amount: true },
    }),
    prisma.operationalGoal.findMany({
      where: {
        userId: input.userId,
        status: OperationalGoalStatus.ACTIVE,
        targetDate: { gte: from, lte: to },
      },
      select: { id: true, name: true, targetDate: true },
    }),
  ]);

  // 1) Synthesize recurring bill events for the requested window (deterministic,
  //    no transaction re-detection).
  const billEvents = recurringBills.flatMap(bill =>
    enumerateRecurringBillOccurrences(bill, from, to).map(occurrence => ({
      date: occurrence.toISOString(),
      amount: Math.abs(bill.amount),
      direction: 'OUTFLOW' as const,
      kind: 'recurring_bill' as const,
      label: bill.name,
      referenceIds: [bill.id],
    }))
  );

  // 2) For the ≤30-day overlap window, also pull the forecast's
  //    detected_obligation / detected_income / invoice_expected_payment events
  //    so users see paychecks and detected obligations the bill table can't.
  let forecastEventsInRange: typeof billEvents = [];
  if (differenceInCalendarDays(from, now) <= 30 && differenceInCalendarDays(to, now) >= -30) {
    const forecast = await buildCashFlowForecast(input.userId, { includeDetails: false });
    const win30 = forecast.windows.find(w => w.windowDays === 30);
    if (win30) {
      forecastEventsInRange = win30.events
        .filter(e => e.kind !== 'allocation_drag' && e.kind !== 'recurring_bill' && e.kind !== 'invoice_expected_payment')
        .filter(e => {
          const d = new Date(e.date);
          return d >= from && d <= to;
        });
    }
  }

  const merged = [...billEvents, ...forecastEventsInRange];

  // 3) Clusters apply to the requested range — same algorithm, same defaults.
  const clusters = detectObligationClusters(merged, { startingBalance: 0 });

  // 4) Build canonical calendar entries.
  const recurringBillIds = new Set(recurringBills.map(b => b.id));
  const entries = buildCalendarEntries({
    forecastEvents30d: merged,
    goalTargets: goalTargets
      .filter(g => g.targetDate)
      .map(g => ({
        goalId: g.id,
        name: g.name,
        targetDate: g.targetDate!.toISOString(),
      })),
    invoiceRows: invoiceRows.map(inv => ({
      id: inv.id,
      number: inv.number,
      status: inv.status,
      dueDate: inv.dueDate.toISOString(),
      amount: inv.amount,
    })),
    recurringBillIds,
    clusters,
  });

  return {
    generatedAt: now.toISOString(),
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
    entries,
    clusters,
  };
}
