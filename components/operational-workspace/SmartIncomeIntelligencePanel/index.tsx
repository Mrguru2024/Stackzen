'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import type { IncomeIntelligenceSnapshotDto } from '@/lib/income-intelligence/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { PiggyBank, RefreshCw } from 'lucide-react';

function statusBadge(hasIssues: boolean) {
  if (hasIssues) return <Badge variant="destructive">Attention</Badge>;
  return <Badge variant="secondary">Stable signals</Badge>;
}

export default function SmartIncomeIntelligencePanel() {
  const [snap, setSnap] = useState<IncomeIntelligenceSnapshotDto | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/operational-center/income-intelligence?ensure=true', {
        credentials: 'same-origin',
      });
      if (!res.ok) throw new Error('load');
      setSnap((await res.json()) as IncomeIntelligenceSnapshotDto);
    } catch {
      toast.error('Could not load income intelligence');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-base">Income health</CardTitle>
          <CardDescription>Ledger-backed payout analysis…</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-16 w-full rounded-lg" />
          <Skeleton className="h-16 w-full rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  if (!snap) return null;

  const hasAttention =
    snap.delayedIncome.length > 0 ||
    snap.irregularPayouts.length > 0 ||
    snap.decliningPayouts.length > 0 ||
    snap.concentration.herfindahlIndex >= 0.48 ||
    (snap.concentration.topSources[0]?.shareOfTotal ?? 0) >= 0.58;

  return (
    <Card className="border-border">
      <CardHeader className="space-y-1">
        <CardTitle className="flex flex-wrap items-center gap-2 text-lg">
          <PiggyBank className="h-5 w-5 shrink-0" aria-hidden />
          Income health
          {statusBadge(hasAttention)}
        </CardTitle>
        <CardDescription>
          Deterministic signals from <span className="font-medium text-foreground">FinancialTransaction</span> and the
          same recurrence engine as Cash Flow — no synthetic income scores. Operational alerts sync when you refresh
          the workspace queue.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5 text-sm">
        {snap.delayedIncome.length > 0 ? (
          <section className="space-y-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
            <h3 className="font-semibold text-foreground">Delayed expected deposits</h3>
            <ul className="list-inside list-disc space-y-1 text-muted-foreground">
              {snap.delayedIncome.slice(0, 5).map(d => (
                <li key={d.seriesKey}>
                  <span className="text-foreground">{d.label}</span> · {d.daysPastExpected}d past expected ·{' '}
                  {d.cadence} · sample tx:{' '}
                  {d.sampleTransactionIds.slice(0, 2).map(id => (
                    <Link
                      key={id}
                      href={`/money-control?tab=review&txnId=${id}`}
                      className="font-mono text-xs text-primary underline-offset-4 hover:underline"
                    >
                      {id.slice(0, 8)}…
                    </Link>
                  ))}
                </li>
              ))}
            </ul>
          </section>
        ) : (
          <p className="text-muted-foreground">No overdue modeled deposits vs recurrence expectations.</p>
        )}

        <section className="space-y-2">
          <h3 className="font-semibold text-foreground">Concentration (90d inflows)</h3>
          <p className="text-muted-foreground">
            HHI-style index: <span className="font-mono text-foreground">{snap.concentration.herfindahlIndex.toFixed(3)}</span>{' '}
            · Total inflows: ${snap.concentration.totalInflowUsd.toFixed(0)}
          </p>
          <ul className="space-y-1">
            {snap.concentration.topSources.slice(0, 4).map(s => (
              <li key={s.seriesKey} className="flex flex-wrap justify-between gap-2 text-muted-foreground">
                <span className="text-foreground">{s.label}</span>
                <span>{(s.shareOfTotal * 100).toFixed(1)}%</span>
              </li>
            ))}
          </ul>
        </section>

        {snap.irregularPayouts.length > 0 ? (
          <section className="space-y-2 rounded-lg border border-border bg-muted/20 p-3">
            <h3 className="font-semibold text-foreground">Irregular payout intervals</h3>
            <ul className="list-inside list-disc space-y-1 text-muted-foreground">
              {snap.irregularPayouts.slice(0, 4).map(i => (
                <li key={i.series.key}>
                  {i.series.label} · confidence {i.series.confidence.toFixed(2)} · every ~{i.series.medianIntervalDays.toFixed(0)}d
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {snap.decliningPayouts.length > 0 ? (
          <section className="space-y-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
            <h3 className="font-semibold text-foreground">Declining recent payouts</h3>
            <ul className="list-inside list-disc space-y-1 text-muted-foreground">
              {snap.decliningPayouts.slice(0, 4).map(d => (
                <li key={d.seriesKey}>
                  {d.label}: recent median ${d.recentMedianUsd.toFixed(0)} vs prior ${d.priorMedianUsd.toFixed(0)}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {snap.reserveNudges.length > 0 ? (
          <section className="space-y-2">
            <h3 className="font-semibold text-foreground">Reserve guidance (rules + forecast codes)</h3>
            <ul className="space-y-2">
              {snap.reserveNudges.map(n => (
                <li key={n.code} className="rounded-md border border-border p-2">
                  <p className="font-medium text-foreground">{n.summary}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{n.detail}</p>
                  {n.reasoning.map((line, idx) => (
                    <p key={idx} className="mt-1 text-xs text-muted-foreground">
                      {line}
                    </p>
                  ))}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {snap.forecastRiskCodes.length > 0 ? (
          <p className="text-xs text-muted-foreground">
            Active cashflow risk codes:{' '}
            <span className="font-mono text-foreground">{snap.forecastRiskCodes.join(', ')}</span>
          </p>
        ) : null}

        <details className="rounded-md border border-border bg-muted/10 p-3 text-xs text-muted-foreground">
          <summary className="cursor-pointer font-medium text-foreground">Explainability</summary>
          <ul className="mt-2 list-inside list-disc space-y-1">
            {snap.explain.assumptions.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
          <p className="mt-2 font-mono text-[10px] leading-relaxed">{JSON.stringify(snap.explain.inputsUsed)}</p>
        </details>

        <div className="flex flex-wrap gap-2 border-t border-border pt-3">
          <Button
            type="button"
            variant="secondary"
            size="default"
            className="h-11 touch-manipulation sm:h-10"
            onClick={() => void load()}
          >
            <RefreshCw className="mr-2 h-4 w-4" aria-hidden />
            Refresh analysis
          </Button>
          <Button variant="outline" size="default" className="h-11 touch-manipulation sm:h-10" asChild>
            <Link href="/cash-flow">Open Cash Flow</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
