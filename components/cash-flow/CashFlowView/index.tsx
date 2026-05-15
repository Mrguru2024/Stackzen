'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import type { CashFlowForecastResponseDto } from '@/lib/cashflow/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function CashFlowView() {
  const [data, setData] = useState<CashFlowForecastResponseDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/cashflow/forecast?includeDetails=false', { credentials: 'same-origin' });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error((j as { error?: string }).error ?? 'Failed to load forecast');
      }
      setData((await res.json()) as CashFlowForecastResponseDto);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
      toast.error('Could not load cash flow forecast');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading && !data) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        Loading deterministic cash flow projection…
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="space-y-4 py-8">
        <p className="text-destructive">{error}</p>
        <Button type="button" onClick={() => void load()}>
          Retry
        </Button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        No forecast data. Connect bank accounts and add transactions to model timing.
      </div>
    );
  }

  const wmap = Object.fromEntries(data.windows.map(w => [w.windowDays, w]));

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Cash flow intelligence</h1>
        <p className="max-w-3xl text-muted-foreground">
          Forward-looking balances use your linked accounts, recurring bills, ledger-derived patterns, unpaid invoices,
          and trailing automation allocations. Numbers are traceable to bank balances and transactions—no fabricated chart
          data.
        </p>
        <div className="flex flex-wrap gap-2 pt-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/operational-center">Operational Center</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/money-control">Money Control</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/financial-timeline">Financial timeline</Link>
          </Button>
          <Button size="sm" variant="secondary" onClick={() => void load()} disabled={loading}>
            {loading ? 'Refreshing…' : 'Refresh'}
          </Button>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        {([7, 14, 30] as const).map(days => {
          const w = wmap[days];
          if (!w) return null;
          return (
            <Card key={days}>
              <CardHeader>
                <CardTitle>{days}-day outlook</CardTitle>
                <CardDescription>Ending vs starting liquidity</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 font-mono text-sm">
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground">Projected end</span>
                  <span>${w.projectedEndingBalance.toFixed(2)}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground">Lowest point</span>
                  <span className={w.lowestProjectedBalance < 0 ? 'text-destructive' : ''}>
                    ${w.lowestProjectedBalance.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between gap-2 text-xs text-muted-foreground">
                  <span>Low date</span>
                  <span>
                    {w.lowestProjectedBalanceDate
                      ? new Date(w.lowestProjectedBalanceDate).toLocaleDateString()
                      : '—'}
                  </span>
                </div>
                <Badge variant={w.riskLevel === 'high' ? 'destructive' : 'secondary'} className="mt-2 capitalize">
                  {w.riskLevel} risk
                </Badge>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Risk signals</CardTitle>
          <CardDescription>Derived from the 30-day projection window.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.risks.length === 0 ? (
            <p className="text-sm text-muted-foreground">No structural timing risks detected with current inputs.</p>
          ) : (
            data.risks.map(r => (
              <div key={r.code} className="rounded-lg border p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={r.severity === 'critical' ? 'destructive' : 'outline'}>{r.code}</Badge>
                  <span className="font-medium">{r.summary}</span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{r.detail}</p>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Upcoming obligations (detected)</CardTitle>
            <CardDescription>Statistical patterns from outflows · confidence varies.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {data.recurringObligations.length === 0 ? (
              <p className="text-muted-foreground">No stable recurring patterns yet—need more ledger history.</p>
            ) : (
              <ul className="space-y-2">
                {data.recurringObligations.slice(0, 12).map(o => (
                  <li key={o.key} className="flex justify-between gap-2 border-b border-border/60 pb-2">
                    <span className="truncate">{o.label}</span>
                    <span className="shrink-0 font-mono">
                      ~${o.medianAmount.toFixed(2)} · {o.cadence}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Expected income (detected)</CardTitle>
            <CardDescription>Statistical inflow patterns from deposits.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {data.recurringIncome.length === 0 ? (
              <p className="text-muted-foreground">No stable income cadence detected yet.</p>
            ) : (
              <ul className="space-y-2">
                {data.recurringIncome.slice(0, 12).map(o => (
                  <li key={o.key} className="flex justify-between gap-2 border-b border-border/60 pb-2">
                    <span className="truncate">{o.label}</span>
                    <span className="shrink-0 font-mono">
                      ~${o.medianAmount.toFixed(2)} · {o.cadence}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Explainability</CardTitle>
          <CardDescription>Assumptions · inputs · confidence tier.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">Confidence: {data.explain.confidence}</Badge>
            <Badge variant="outline">Starting balance ${Number(data.explain.inputsUsed.startingBalanceUsd).toFixed(2)}</Badge>
          </div>
          <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
            {data.explain.assumptions.slice(0, 8).map(a => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
