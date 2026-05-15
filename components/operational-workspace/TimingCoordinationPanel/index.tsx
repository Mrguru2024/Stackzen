'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { CalendarClock, RefreshCw } from 'lucide-react';
import type { TimingCoordinationSnapshotDto } from '@/lib/timing-coordination/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const FACTOR_LABEL: Record<string, string> = {
  OBLIGATION_CLUSTER_PRESENT: 'Obligation cluster present',
  OBLIGATION_CLUSTER_DENSE: 'Obligation cluster is dense',
  PAYOUT_BILL_CONFLICT: 'Payout vs bill timing conflict',
  FORECAST_INSTABILITY_WINDOW: 'Forecast instability window',
  RESERVE_PREP_BEHIND_CLUSTER: 'Reserve prep behind cluster',
  CONTRACTOR_PAYOUT_OVERLAP: 'Contractor payout overlap',
};

const GUIDANCE_LINK: Partial<Record<string, { href: string; label: string }>> = {
  DELAY_DISCRETIONARY_ALLOCATION: { href: '/money-control?tab=rules', label: 'Money Control · rules' },
  PREPARE_RESERVE_BUFFER: { href: '/goals/operational', label: 'Operational goals' },
  SLOW_LOW_PRIORITY_GOAL: { href: '/goals/operational', label: 'Operational goals' },
  SHIFT_TO_AVOID_CLUSTER: { href: '/operational-center/calendar', label: 'Open the timing calendar' },
  CONTRACTOR_TIGHTEN_DEPOSIT_TIMING: { href: '/jobs', label: 'Jobs · contractor ops' },
};

export interface TimingCoordinationPanelProps {
  compactSummary?: boolean;
}

export default function TimingCoordinationPanel({ compactSummary = false }: TimingCoordinationPanelProps) {
  const [snap, setSnap] = useState<TimingCoordinationSnapshotDto | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/operational-center/timing-coordination', { credentials: 'same-origin' });
      if (!res.ok) throw new Error('load');
      setSnap((await res.json()) as TimingCoordinationSnapshotDto);
    } catch {
      toast.error('Could not load timing coordination snapshot');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <Card className="border-dashed" id="timing-coordination">
        <CardHeader>
          <CardTitle className="text-base">Timing coordination</CardTitle>
          <CardDescription>Deterministic obligation clustering and payout timing…</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full rounded-lg" />
        </CardContent>
      </Card>
    );
  }
  if (!snap) return null;

  const denseCluster = snap.clusters.find(c => c.dense);
  const elevated = snap.pressureScore >= 3 || Boolean(denseCluster) || snap.reservePrepGoals.length > 0;

  return (
    <Card className="border-border" id="timing-coordination">
      <CardHeader className="space-y-1">
        <CardTitle className="flex flex-wrap items-center gap-2 text-lg">
          <CalendarClock className="h-5 w-5 shrink-0" aria-hidden />
          Timing coordination & calendar intelligence
        </CardTitle>
        <CardDescription>
          {compactSummary ? (
            <>
              Bands and escalation are summarized in the <span className="font-medium text-foreground">command center</span>.
              Below: same snapshot drill-down (clusters, conflicts, guidance).
            </>
          ) : (
            <>
              Deterministic obligation clusters, payout-vs-bill conflicts and instability windows from the 30-day cash-flow
              forecast. Read-only summary — open the timing calendar to drag-and-drop shift proposals.
            </>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5 text-sm">
        <section className="rounded-md border border-border bg-muted/10 p-3 text-xs">
          <p>
            <span className="font-semibold text-foreground">pressureScore = {snap.pressureScore}</span>
            {' · '}
            elevated:{' '}
            <span className={elevated ? 'font-medium text-amber-600 dark:text-amber-400' : 'text-muted-foreground'}>
              {elevated ? 'yes' : 'no'}
            </span>
            {' · '}clusters:{' '}
            <span className="font-mono text-foreground">{snap.clusters.length}</span> (dense:{' '}
            <span className="font-mono text-foreground">{snap.clusters.filter(c => c.dense).length}</span>)
            {' · '}conflicts: <span className="font-mono text-foreground">{snap.conflicts.length}</span>
            {' · '}reserve-prep goals:{' '}
            <span className="font-mono text-foreground">{snap.reservePrepGoals.length}</span>
          </p>
          <p className="mt-2 text-muted-foreground">
            {compactSummary ? (
              <>
                Drag-and-drop shift proposals:{' '}
                <Link href="/operational-center/calendar" className="font-medium text-primary underline-offset-2 hover:underline">
                  timing calendar
                </Link>
                .
              </>
            ) : (
              <>
                Snapshot is read-only. Drag-and-drop shift proposals live on the dedicated{' '}
                <Link href="/operational-center/calendar" className="font-medium text-primary underline-offset-2 hover:underline">
                  timing calendar
                </Link>
                ; nothing auto-applies.
              </>
            )}
          </p>
        </section>

        {snap.factors.length > 0 ? (
          <section className="space-y-2">
            <h3 className="font-semibold text-foreground">Timing pressure factors</h3>
            {compactSummary ? (
              <ul className="space-y-1 text-xs text-muted-foreground">
                {snap.factors.map(f => (
                  <li key={f.code} className="rounded border border-border/80 px-2 py-1">
                    <span className="font-mono text-[11px] text-foreground">{FACTOR_LABEL[f.code] ?? f.code}</span>
                    <span className="text-foreground"> — {f.summary}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <ul className="space-y-2 text-xs text-muted-foreground">
                {snap.factors.map(f => (
                  <li key={f.code} className="rounded border border-border/80 p-2">
                    <span className="font-mono text-[11px] text-foreground">{FACTOR_LABEL[f.code] ?? f.code}</span>
                    <p className="mt-0.5 text-foreground">{f.summary}</p>
                    {f.reasoning.length > 0 ? (
                      <ul className="mt-1 list-disc pl-5 text-[11px]">
                        {f.reasoning.map((r, i) => (
                          <li key={`${f.code}-${i}`}>{r}</li>
                        ))}
                      </ul>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </section>
        ) : (
          <p className="text-xs italic text-muted-foreground">No timing pressure factors fired in this snapshot.</p>
        )}

        {snap.clusters.length > 0 ? (
          <section className="space-y-2">
            <h3 className="font-semibold text-foreground">Obligation clusters</h3>
            <ul className="space-y-2 text-xs">
              {(compactSummary ? snap.clusters.slice(0, 2) : snap.clusters).map(c => (
                <li
                  key={c.id}
                  className={`rounded border p-2 ${c.dense ? 'border-amber-500/60 bg-amber-500/5' : 'border-border/80'}`}
                >
                  <p className="text-foreground">
                    <span className="font-mono">{c.startDate}</span> → <span className="font-mono">{c.endDate}</span>{' '}
                    <span className="text-muted-foreground">({c.bandDays} day band)</span>{' '}
                    <span className="font-mono">${c.totalAmountUsd.toFixed(2)}</span>{' '}
                    <span className="text-muted-foreground">· {c.events.length} events</span>
                    {c.dense ? <span className="ml-2 rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-amber-700 dark:text-amber-300">Dense</span> : null}
                  </p>
                  {!compactSummary ? (
                    <p className="mt-1 text-muted-foreground">
                      {c.events
                        .slice(0, 4)
                        .map(e => `${e.date.slice(5)} ${e.label} ($${e.amountUsd.toFixed(0)})`)
                        .join(' · ')}
                      {c.events.length > 4 ? ` · +${c.events.length - 4} more` : ''}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
            {compactSummary && snap.clusters.length > 2 ? (
              <p className="text-[11px] text-muted-foreground">+{snap.clusters.length - 2} more clusters in this window.</p>
            ) : null}
          </section>
        ) : null}

        {snap.conflicts.length > 0 ? (
          <section className="space-y-1">
            <h3 className="font-semibold text-foreground">Payout-vs-bill conflicts</h3>
            <ul className="space-y-1 text-xs text-muted-foreground">
              {(compactSummary ? snap.conflicts.slice(0, 2) : snap.conflicts.slice(0, 5)).map(c => (
                <li key={c.date}>
                  <span className="font-mono text-foreground">{c.date}</span> · deficit{' '}
                  <span className="font-mono text-foreground">${c.deficitUsd.toFixed(2)}</span> (inflow{' '}
                  <span className="font-mono">${c.precedingInflowUsd.toFixed(2)}</span>, outflow on day{' '}
                  <span className="font-mono">${c.outflowOnDayUsd.toFixed(2)}</span>)
                </li>
              ))}
            </ul>
            {compactSummary && snap.conflicts.length > 2 ? (
              <p className="text-[11px] text-muted-foreground">+{snap.conflicts.length - 2} more conflict day(s).</p>
            ) : null}
          </section>
        ) : null}

        {snap.instabilityWindow ? (
          <section className="rounded border border-border/80 p-2 text-xs">
            <h3 className="font-semibold text-foreground">Forecast instability window</h3>
            <p className="mt-1 text-muted-foreground">
              Balance &lt; ${snap.instabilityWindow.thresholdUsd.toFixed(2)} for{' '}
              <span className="font-mono text-foreground">{snap.instabilityWindow.daysCount}</span> consecutive day(s){' '}
              ({snap.instabilityWindow.startDate} → {snap.instabilityWindow.endDate}).
            </p>
          </section>
        ) : null}

        {snap.guidance.length > 0 ? (
          <section className="space-y-2">
            <h3 className="font-semibold text-foreground">Guidance</h3>
            <ul className="space-y-2 text-xs">
              {snap.guidance.map(g => {
                const link = GUIDANCE_LINK[g.code];
                return (
                  <li key={g.code} className="rounded border border-border/80 p-2">
                    <p className="font-medium text-foreground">{g.title}</p>
                    <p className="mt-0.5 text-muted-foreground">{g.detail}</p>
                    {link ? (
                      <Link
                        href={link.href}
                        className="mt-1 inline-block text-xs font-medium text-primary underline-offset-2 hover:underline"
                      >
                        {link.label} →
                      </Link>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}

        <section className="flex flex-wrap gap-2 pt-2 text-xs">
          <Button
            variant="ghost"
            size="sm"
            type="button"
            onClick={() => void load()}
            className="h-8 px-2"
          >
            <RefreshCw className="mr-1 h-3 w-3" aria-hidden /> Refresh
          </Button>
          <Link
            href="/cash-flow"
            className="rounded border border-border bg-card px-2 py-1 text-foreground hover:bg-accent/40"
          >
            Cash flow
          </Link>
          <Link
            href="/goals/operational"
            className="rounded border border-border bg-card px-2 py-1 text-foreground hover:bg-accent/40"
          >
            Operational goals
          </Link>
          <Link
            href="/operational-center/calendar"
            className="rounded border border-primary/40 bg-primary/10 px-2 py-1 font-medium text-primary hover:bg-primary/20"
          >
            Open timing calendar →
          </Link>
        </section>
      </CardContent>
    </Card>
  );
}
