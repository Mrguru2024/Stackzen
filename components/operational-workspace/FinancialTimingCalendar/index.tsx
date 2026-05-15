'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns';
import { CalendarDays, ChevronLeft, ChevronRight, Link2, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import type {
  ObligationClusterDto,
  TimingCalendarEntryDto,
} from '@/lib/timing-coordination/types';
import { buildAddToGoogleCalendarUrl } from '@/lib/timing-coordination/ics-feed';

interface CalendarApiResponse {
  generatedAt: string;
  range: { from: string | null; to: string | null };
  entries: TimingCalendarEntryDto[];
  clusters: ObligationClusterDto[];
}

interface FeedTokenResponse {
  token: string;
  feedUrl: string;
  expiresInDays: number;
}

function ymd(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

function entryAccent(entry: TimingCalendarEntryDto): string {
  if (entry.direction === 'INFLOW') {
    return 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300';
  }
  if (entry.direction === 'OUTFLOW') {
    return 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300';
  }
  return 'border-slate-500/40 bg-slate-500/10 text-slate-700 dark:text-slate-300';
}

export default function FinancialTimingCalendar() {
  const router = useRouter();
  const [data, setData] = useState<CalendarApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [cursor, setCursor] = useState<Date>(() => new Date());
  const [dropTarget, setDropTarget] = useState<{
    entry: TimingCalendarEntryDto;
    newDate: string;
  } | null>(null);
  const [feedUrl, setFeedUrl] = useState<string | null>(null);
  const [feedError, setFeedError] = useState<string | null>(null);

  const monthStart = useMemo(() => startOfMonth(cursor), [cursor]);
  const monthEnd = useMemo(() => endOfMonth(cursor), [cursor]);
  const gridStart = useMemo(() => startOfWeek(monthStart), [monthStart]);
  const gridEnd = useMemo(() => endOfWeek(monthEnd), [monthEnd]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const from = ymd(gridStart);
      const to = ymd(gridEnd);
      const res = await fetch(
        `/api/operational-center/timing-coordination/calendar?from=${from}&to=${to}`,
        { credentials: 'same-origin' }
      );
      if (!res.ok) throw new Error('calendar');
      setData((await res.json()) as CalendarApiResponse);
    } catch {
      toast.error('Could not load timing calendar');
    } finally {
      setLoading(false);
    }
  }, [gridStart, gridEnd]);

  useEffect(() => {
    void load();
  }, [load]);

  const days = useMemo(
    () => eachDayOfInterval({ start: gridStart, end: gridEnd }),
    [gridStart, gridEnd]
  );

  const entriesByDay = useMemo(() => {
    const map = new Map<string, TimingCalendarEntryDto[]>();
    if (!data) return map;
    for (const entry of data.entries) {
      const key = entry.date.slice(0, 10);
      const list = map.get(key) ?? [];
      list.push(entry);
      map.set(key, list);
    }
    return map;
  }, [data]);

  const clusterDays = useMemo(() => {
    const set = new Set<string>();
    if (!data) return set;
    for (const c of data.clusters) {
      const start = new Date(`${c.startDate}T00:00:00Z`);
      const end = new Date(`${c.endDate}T00:00:00Z`);
      for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
        set.add(d.toISOString().slice(0, 10));
      }
    }
    return set;
  }, [data]);

  const handleDragStart = useCallback(
    (entry: TimingCalendarEntryDto) => (event: React.DragEvent<HTMLDivElement>) => {
      if (!entry.shiftable) {
        event.preventDefault();
        return;
      }
      event.dataTransfer.setData('application/x-stackzen-entry', entry.id);
      event.dataTransfer.effectAllowed = 'move';
    },
    []
  );

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    if (event.dataTransfer.types.includes('application/x-stackzen-entry')) {
      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';
    }
  }, []);

  const handleDrop = useCallback(
    (dayYmd: string) => (event: React.DragEvent<HTMLDivElement>) => {
      const entryId = event.dataTransfer.getData('application/x-stackzen-entry');
      if (!entryId || !data) return;
      const entry = data.entries.find(e => e.id === entryId);
      if (!entry || !entry.shiftable) return;
      const currentYmd = entry.date.slice(0, 10);
      if (currentYmd === dayYmd) return;
      if (dayYmd < ymd(new Date())) {
        toast.error('Cannot move a bill to a past date — proposals must be in the future.');
        return;
      }
      setDropTarget({ entry, newDate: dayYmd });
    },
    [data]
  );

  const submitShift = useCallback(async () => {
    if (!dropTarget) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/operational-center/timing-coordination/shift-bill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          billId: dropTarget.entry.referenceIds[0],
          proposedDate: `${dropTarget.newDate}T00:00:00.000Z`,
        }),
      });
      const json = (await res.json()) as { notificationId?: string; error?: string };
      if (!res.ok || !json.notificationId) {
        toast.error(json.error ?? 'Failed to create proposal');
        return;
      }
      toast.success('Shift proposal created — preview & approve in Operations hub.');
      setDropTarget(null);
      router.push(`/operational-center#operational-actions`);
    } catch {
      toast.error('Failed to create proposal');
    } finally {
      setSubmitting(false);
    }
  }, [dropTarget, router]);

  const requestFeedToken = useCallback(async () => {
    setFeedError(null);
    try {
      const res = await fetch('/api/operational-center/timing-coordination/feed-token', {
        method: 'POST',
        credentials: 'same-origin',
      });
      const json = (await res.json()) as Partial<FeedTokenResponse> & { error?: string };
      if (!res.ok || !json.feedUrl) {
        setFeedError(json.error ?? 'Could not issue feed token');
        return;
      }
      setFeedUrl(json.feedUrl);
    } catch {
      setFeedError('Could not issue feed token');
    }
  }, []);

  if (loading) {
    return (
      <Card className="border-dashed" id="financial-timing-calendar">
        <CardHeader>
          <CardTitle className="text-base">Financial timing calendar</CardTitle>
          <CardDescription>Loading deterministic projection…</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full rounded-lg" />
        </CardContent>
      </Card>
    );
  }
  if (!data) return null;

  return (
    <Card className="border-border" id="financial-timing-calendar">
      <CardHeader className="space-y-1">
        <CardTitle className="flex flex-wrap items-center gap-2 text-lg">
          <CalendarDays className="h-5 w-5 shrink-0" aria-hidden />
          Financial timing calendar
        </CardTitle>
        <CardDescription>
          Interactive projection of recurring bills, detected obligations, invoice due dates and goal targets.
          Drag a recurring-bill chip onto another day to propose a shift (you still approve every change).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 px-2"
              onClick={() => setCursor(c => subMonths(c, 1))}
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden />
            </Button>
            <p className="text-base font-semibold text-foreground">{format(cursor, 'MMMM yyyy')}</p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 px-2"
              onClick={() => setCursor(c => addMonths(c, 1))}
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" aria-hidden />
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 px-2"
              onClick={() => void load()}
            >
              <RefreshCw className="mr-1 h-3 w-3" aria-hidden /> Refresh
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 px-2"
              onClick={() => void requestFeedToken()}
            >
              <Link2 className="mr-1 h-3 w-3" aria-hidden /> Subscribe in Google Calendar
            </Button>
          </div>
        </div>

        {feedUrl ? (
          <section className="rounded border border-emerald-500/30 bg-emerald-500/5 p-2 text-xs">
            <p className="text-foreground">
              In Google Calendar &rarr; <em>Other calendars</em> &rarr; <em>From URL</em> &rarr; paste:
            </p>
            <code className="mt-1 block break-all rounded bg-background/80 p-2 text-[10px] text-foreground">
              {feedUrl}
            </code>
            <p className="mt-1 text-muted-foreground">
              Read-only feed signed for your account; expires after 180 days. Re-request a token to rotate. Requires
              <code className="mx-1 rounded bg-background/80 px-1">STACKZEN_FEED_TOKEN_SECRET</code> on the server.
            </p>
          </section>
        ) : null}
        {feedError ? (
          <p className="rounded border border-amber-500/40 bg-amber-500/5 p-2 text-xs text-amber-800 dark:text-amber-300">
            {feedError}
          </p>
        ) : null}

        <div className="grid grid-cols-7 gap-1 text-[11px] uppercase text-muted-foreground">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className="px-1 py-0.5 text-center">
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {days.map(day => {
            const key = ymd(day);
            const inMonth = isSameMonth(day, cursor);
            const isClusterDay = clusterDays.has(key);
            const dayEntries = entriesByDay.get(key) ?? [];
            const inflow = dayEntries
              .filter(e => e.direction === 'INFLOW')
              .reduce((s, e) => s + (e.amountUsd ?? 0), 0);
            const outflow = dayEntries
              .filter(e => e.direction === 'OUTFLOW')
              .reduce((s, e) => s + (e.amountUsd ?? 0), 0);
            return (
              <div
                key={key}
                role="gridcell"
                className={[
                  'min-h-[6.5rem] rounded-md border p-1 text-[11px] transition-colors',
                  inMonth ? 'bg-card' : 'bg-muted/30 opacity-70',
                  isClusterDay ? 'border-amber-500/60' : 'border-border',
                ].join(' ')}
                onDragOver={handleDragOver}
                onDrop={handleDrop(key)}
                data-ymd={key}
                aria-label={`${key}${isClusterDay ? ', part of an obligation cluster' : ''}`}
              >
                <div className="flex items-center justify-between text-foreground">
                  <span className="font-mono">{format(day, 'd')}</span>
                  {isClusterDay ? (
                    <span className="rounded bg-amber-500/20 px-1 text-[9px] font-semibold uppercase text-amber-700 dark:text-amber-300">
                      Cluster
                    </span>
                  ) : null}
                </div>
                <ul className="mt-1 space-y-0.5">
                  {dayEntries.slice(0, 4).map(entry => {
                    const draggable = entry.shiftable;
                    return (
                      <li key={entry.id}>
                        <div
                          draggable={draggable}
                          onDragStart={handleDragStart(entry)}
                          className={[
                            'flex items-center justify-between gap-1 rounded border px-1 py-0.5',
                            entryAccent(entry),
                            draggable ? 'cursor-grab active:cursor-grabbing' : '',
                          ].join(' ')}
                          title={entry.reasoning.join(' · ')}
                        >
                          <span className="truncate">{entry.label}</span>
                          {entry.amountUsd != null ? (
                            <span className="ml-1 shrink-0 font-mono">
                              {entry.direction === 'INFLOW' ? '+' : entry.direction === 'OUTFLOW' ? '-' : ''}$
                              {Math.round(entry.amountUsd)}
                            </span>
                          ) : null}
                        </div>
                        <Link
                          href={buildAddToGoogleCalendarUrl(entry, {
                            detailsSuffix: 'Source: StackZen Operations',
                          })}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block text-[9px] text-muted-foreground hover:text-foreground"
                        >
                          + Google Calendar
                        </Link>
                      </li>
                    );
                  })}
                  {dayEntries.length > 4 ? (
                    <li className="text-[9px] text-muted-foreground">+{dayEntries.length - 4} more</li>
                  ) : null}
                </ul>
                {inflow > 0 || outflow > 0 ? (
                  <p className="mt-1 text-[9px] text-muted-foreground">
                    {inflow > 0 ? (
                      <span className="text-emerald-600 dark:text-emerald-400">+${Math.round(inflow)}</span>
                    ) : null}
                    {inflow > 0 && outflow > 0 ? ' · ' : null}
                    {outflow > 0 ? (
                      <span className="text-amber-600 dark:text-amber-400">-${Math.round(outflow)}</span>
                    ) : null}
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>

        <p className="text-xs text-muted-foreground">
          Drag handles are enabled on recurring-bill chips only; goal targets and invoice due dates are not draggable.
          Drop opens a confirmation; nothing is mutated until you apply the proposal in the Operations hub.
        </p>
      </CardContent>

      <Dialog open={!!dropTarget} onOpenChange={open => !open && setDropTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Propose a timing shift</DialogTitle>
            <DialogDescription>
              {dropTarget ? (
                <>
                  Move <strong>{dropTarget.entry.label}</strong> from{' '}
                  <span className="font-mono">{dropTarget.entry.date.slice(0, 10)}</span> to{' '}
                  <span className="font-mono">{dropTarget.newDate}</span>. This creates a{' '}
                  <code className="rounded bg-muted/40 px-1">SHIFT_RECURRING_BILL_DATE</code> proposal in your attention
                  queue — nothing is written until you preview and apply.
                </>
              ) : null}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="ghost" type="button" onClick={() => setDropTarget(null)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="button" onClick={() => void submitShift()} disabled={submitting}>
              {submitting ? 'Creating…' : 'Create proposal'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
