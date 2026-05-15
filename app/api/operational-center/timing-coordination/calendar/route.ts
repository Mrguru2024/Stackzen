import { addDays, startOfDay } from 'date-fns';
import { NextResponse } from 'next/server';
import { requireAuthSession } from '@/lib/api/require-auth';
import { buildCalendarFeedForRange } from '@/lib/timing-coordination/calendar-feed';
import { buildTimingCoordinationSnapshot } from '@/lib/timing-coordination/snapshot';

function parseYmd(value: string | null): Date | null {
  if (!value) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const d = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(d.getTime()) ? d : null;
}

/**
 * Calendar feed for the in-app calendar UI. Supports arbitrary `from` / `to`
 * windows by enumerating recurring bills, invoices and goal targets directly —
 * not bounded by the 30-day forecast snapshot. Also enriches with the snapshot's
 * conflicts / instability window / factors so panels can stay synchronized.
 */
export async function GET(request: Request) {
  const { session, response } = await requireAuthSession();
  if (response) return response;

  const url = new URL(request.url);
  const today = startOfDay(new Date());
  const from = parseYmd(url.searchParams.get('from')) ?? addDays(today, -7);
  const to = parseYmd(url.searchParams.get('to')) ?? addDays(today, 60);

  const [feed, snapshot] = await Promise.all([
    buildCalendarFeedForRange({ userId: session.user.id, from, to }),
    buildTimingCoordinationSnapshot(session.user.id),
  ]);

  return NextResponse.json({
    generatedAt: feed.generatedAt,
    range: { from: feed.from, to: feed.to },
    entries: feed.entries,
    clusters: feed.clusters,
    // Snapshot signals are window-independent (30-day forecast) — useful for
    // the calendar's banner/legend.
    conflicts: snapshot.conflicts,
    instabilityWindow: snapshot.instabilityWindow,
    factors: snapshot.factors,
    pressureScore: snapshot.pressureScore,
  });
}
