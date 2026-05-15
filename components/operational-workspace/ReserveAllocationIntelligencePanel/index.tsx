'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import type { ReserveAllocationSnapshotDto } from '@/lib/reserve-allocation-intelligence/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { PiggyBank, RefreshCw } from 'lucide-react';

function formatUsd(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });
}

function formatPercent(share: number): string {
  return `${(share * 100).toFixed(1)}%`;
}

export interface ReserveAllocationIntelligencePanelProps {
  /** When true, defers long copy to `<details>` — use on the ops hub with the command center. */
  compactSummary?: boolean;
}

export default function ReserveAllocationIntelligencePanel({
  compactSummary = false,
}: ReserveAllocationIntelligencePanelProps) {
  const [snap, setSnap] = useState<ReserveAllocationSnapshotDto | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/operational-center/reserve-allocation-intelligence?ensure=true', {
        credentials: 'same-origin',
      });
      if (!res.ok) throw new Error('load');
      setSnap((await res.json()) as ReserveAllocationSnapshotDto);
    } catch {
      toast.error('Could not load reserve & allocation intelligence');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <Card className="border-dashed" id="reserve-allocation-intelligence">
        <CardHeader>
          <CardTitle className="text-base">Reserve & allocation intelligence</CardTitle>
          <CardDescription>Forecast-linked pressure and guidance…</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-16 w-full rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  if (!snap) return null;

  const elevated =
    snap.factors.some(f => f.code === 'PROJECTED_LOW_BALANCE_CRITICAL') || snap.pressureScore >= 4;

  return (
    <Card className="border-border" id="reserve-allocation-intelligence">
      <CardHeader className="space-y-1">
        <CardTitle className="flex flex-wrap items-center gap-2 text-lg">
          <PiggyBank className="h-5 w-5 shrink-0" aria-hidden />
          Reserve & allocation intelligence
        </CardTitle>
        <CardDescription>
          {compactSummary ? (
            <>
              High-level reserve band lives in the <span className="font-medium text-foreground">command center</span>{' '}
              above. This card is drill-down: factors, goals, and links — same deterministic data.
            </>
          ) : (
            <>
              Deterministic pressure factors from <span className="font-medium text-foreground">Cash Flow</span>,{' '}
              <span className="font-medium text-foreground">SmartAllocation</span> pace,{' '}
              <span className="font-medium text-foreground">OperationalGoal</span> buckets, and{' '}
              <span className="font-medium text-foreground">contractor ops</span>.{' '}
              <span className="font-medium text-foreground">pressureScore</span> is the count of active factors — not a
              credit-style health score. Nothing here auto-moves money or edits rules.
            </>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5 text-sm">
        <section className="rounded-md border border-border bg-muted/10 p-3">
          <p className="text-xs text-muted-foreground">
            Weekly allocation pace:{' '}
            <span className="font-mono text-foreground">${snap.weeklyAllocationEstimateUsd.toFixed(2)}</span> · Enabled
            ALLOCATION rules: <span className="font-mono text-foreground">{snap.enabledAllocationRuleCount}</span> ·
            Enabled SavingsRules:{' '}
            <span className="font-mono text-foreground">
              {snap.savingsRulesContext.enabledCount}
              <span className="text-muted-foreground">/{snap.savingsRulesContext.totalCount}</span>
            </span>{' '}
            · Reserve goals under half:{' '}
            <span className="font-mono text-foreground">{snap.reserveGoalUnderfillCount}</span>
          </p>
          {!compactSummary ? (
            <>
              {snap.enabledAllocationRulesSample.length > 0 ? (
                <p className="mt-2 text-xs text-muted-foreground">
                  Top allocation rules (by priority, read-only):{' '}
                  {snap.enabledAllocationRulesSample.map(r => (
                    <span key={r.id} className="mr-2 inline-block font-mono text-[11px] text-foreground">
                      {r.name}
                      <span className="text-muted-foreground">·p{r.priority}</span>
                    </span>
                  ))}
                </p>
              ) : null}
              {snap.savingsRulesContext.sample.length > 0 ? (
                <p className="mt-2 text-xs text-muted-foreground">
                  Active SavingsRules (read-only):{' '}
                  {snap.savingsRulesContext.sample.map(r => (
                    <span key={r.id} className="mr-2 inline-block font-mono text-[11px] text-foreground">
                      {r.name}
                      <span className="text-muted-foreground">·{r.type}</span>
                    </span>
                  ))}
                </p>
              ) : null}
              <p className="mt-2 text-xs text-muted-foreground">
                Trailing {snap.discretionaryOutflowStats.lookbackDays}d discretionary share:{' '}
                <span className="font-mono text-foreground">
                  {formatPercent(snap.discretionaryOutflowStats.discretionaryShare)}
                </span>{' '}
                of {formatUsd(snap.discretionaryOutflowStats.totalOutflowUsd)} OUTFLOW (
                {snap.discretionaryOutflowStats.sampleSize} rows)
                {snap.discretionaryOutflowStats.topDiscretionaryCategories.length > 0 ? (
                  <>
                    {' · top: '}
                    {snap.discretionaryOutflowStats.topDiscretionaryCategories.map((c, i) => (
                      <span key={c.name} className="font-mono text-foreground">
                        {c.name}
                        {i < snap.discretionaryOutflowStats.topDiscretionaryCategories.length - 1 ? ', ' : ''}
                      </span>
                    ))}
                  </>
                ) : null}
              </p>
            </>
          ) : (
            <details className="mt-2 text-xs text-muted-foreground">
              <summary className="cursor-pointer font-medium text-foreground">Rules, savings & discretionary detail</summary>
              {snap.enabledAllocationRulesSample.length > 0 ? (
                <p className="mt-2 text-xs">
                  Allocation rules:{' '}
                  {snap.enabledAllocationRulesSample.map(r => (
                    <span key={r.id} className="mr-2 inline-block font-mono text-[11px] text-foreground">
                      {r.name}
                      <span className="text-muted-foreground">·p{r.priority}</span>
                    </span>
                  ))}
                </p>
              ) : null}
              {snap.savingsRulesContext.sample.length > 0 ? (
                <p className="mt-2 text-xs">
                  SavingsRules:{' '}
                  {snap.savingsRulesContext.sample.map(r => (
                    <span key={r.id} className="mr-2 inline-block font-mono text-[11px] text-foreground">
                      {r.name}
                      <span className="text-muted-foreground">·{r.type}</span>
                    </span>
                  ))}
                </p>
              ) : null}
              <p className="mt-2 text-xs">
                Discretionary {snap.discretionaryOutflowStats.lookbackDays}d:{' '}
                {formatPercent(snap.discretionaryOutflowStats.discretionaryShare)} of{' '}
                {formatUsd(snap.discretionaryOutflowStats.totalOutflowUsd)} ({snap.discretionaryOutflowStats.sampleSize}{' '}
                rows)
                {snap.discretionaryOutflowStats.topDiscretionaryCategories.length > 0 ? (
                  <>
                    {' · top: '}
                    {snap.discretionaryOutflowStats.topDiscretionaryCategories.map((c, i) => (
                      <span key={c.name} className="font-mono text-foreground">
                        {c.name}
                        {i < snap.discretionaryOutflowStats.topDiscretionaryCategories.length - 1 ? ', ' : ''}
                      </span>
                    ))}
                  </>
                ) : null}
              </p>
            </details>
          )}
          <p className="mt-2 font-semibold text-foreground">
            pressureScore = {snap.pressureScore}
            {elevated ? (
              <span className="ml-2 text-amber-600 dark:text-amber-400">· elevated attention threshold met</span>
            ) : null}
          </p>
        </section>

        {snap.topUnderfilledReserveGoals.length > 0 ? (
          <section className="space-y-2">
            <h3 className="font-semibold text-foreground">Reserve goals under half target</h3>
            <ul className="space-y-2 text-xs text-muted-foreground">
              {(compactSummary ? snap.topUnderfilledReserveGoals.slice(0, 2) : snap.topUnderfilledReserveGoals).map(
                g => (
                  <li
                    key={g.goalId}
                    className="flex flex-wrap items-center justify-between gap-2 rounded border border-border/80 p-2"
                  >
                    <span className="text-foreground">
                      {g.name}{' '}
                      <span className="font-mono text-[11px] text-muted-foreground">{g.goalKind}</span>
                      <span className="ml-2 font-mono text-[11px]">
                        {formatUsd(g.currentAmount)} / {formatUsd(g.targetAmount)} ·{' '}
                        {formatPercent(g.progress)}
                      </span>
                    </span>
                    <Button asChild size="sm" variant="outline" className="h-9 px-3 text-xs">
                      <Link href={`/goals/operational?goalId=${encodeURIComponent(g.goalId)}`}>Open goal</Link>
                    </Button>
                  </li>
                )
              )}
            </ul>
            {compactSummary && snap.topUnderfilledReserveGoals.length > 2 ? (
              <p className="text-[11px] text-muted-foreground">
                +{snap.topUnderfilledReserveGoals.length - 2} more in Goals.
              </p>
            ) : null}
          </section>
        ) : null}

        {snap.factors.length > 0 ? (
          <section className="space-y-2">
            <h3 className="font-semibold text-foreground">Active pressure factors</h3>
            {compactSummary ? (
              <>
                <ul className="space-y-1 text-xs text-muted-foreground">
                  {snap.factors.map(f => (
                    <li key={f.code} className="rounded border border-border/80 px-2 py-1">
                      <span className="font-mono text-[11px] text-foreground">{f.code}</span>
                      <span className="text-foreground"> — {f.summary}</span>
                    </li>
                  ))}
                </ul>
                <details className="rounded-md border border-border bg-muted/10 p-2 text-xs">
                  <summary className="cursor-pointer font-medium text-foreground">Factor reasoning (full)</summary>
                  <ul className="mt-2 space-y-2">
                    {snap.factors.map(f => (
                      <li key={`${f.code}-r`} className="rounded border border-border/60 p-2">
                        <span className="font-mono text-[11px]">{f.code}</span>
                        <ul className="mt-1 list-inside list-disc text-muted-foreground">
                          {f.reasoning.map((r, i) => (
                            <li key={i}>{r}</li>
                          ))}
                        </ul>
                      </li>
                    ))}
                  </ul>
                </details>
              </>
            ) : (
              <ul className="max-h-48 space-y-2 overflow-y-auto text-xs text-muted-foreground">
                {snap.factors.map(f => (
                  <li key={f.code} className="rounded border border-border/80 p-2">
                    <span className="font-mono text-[11px] text-foreground">{f.code}</span>
                    <p className="mt-0.5 text-foreground">{f.summary}</p>
                    <ul className="mt-1 list-inside list-disc">
                      {f.reasoning.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ) : (
          <p className="text-xs text-muted-foreground">No pressure factors in this snapshot run.</p>
        )}

        {snap.guidance.length > 0 ? (
          <section className="space-y-2">
            <h3 className="font-semibold text-foreground">Guidance (read-only)</h3>
            {compactSummary
              ? snap.guidance.map(g => (
                  <div key={g.code} className="rounded-md border border-dashed border-border px-2 py-1.5 text-xs">
                    <p className="font-medium text-foreground">{g.title}</p>
                    <p className="text-muted-foreground">{g.detail}</p>
                    <details className="mt-1">
                      <summary className="cursor-pointer text-[11px] text-primary">Why</summary>
                      <ul className="mt-1 list-inside list-disc text-muted-foreground">
                        {g.reasoning.map((r, i) => (
                          <li key={i}>{r}</li>
                        ))}
                      </ul>
                    </details>
                  </div>
                ))
              : snap.guidance.map(g => (
                  <div key={g.code} className="rounded-md border border-dashed border-border p-2 text-xs">
                    <p className="font-medium text-foreground">{g.title}</p>
                    <p className="mt-1 text-muted-foreground">{g.detail}</p>
                    <ul className="mt-1 list-inside list-disc text-muted-foreground">
                      {g.reasoning.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  </div>
                ))}
          </section>
        ) : null}

        <details className="rounded-md border border-border bg-muted/10 p-3 text-xs text-muted-foreground">
          <summary className="cursor-pointer font-medium text-foreground">Explainability</summary>
          <ul className="mt-2 list-inside list-disc space-y-1">
            {snap.explain.assumptions.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
          <p className="mt-2 font-mono text-[10px]">{JSON.stringify(snap.explain.inputsUsed)}</p>
        </details>

        <div className="flex flex-wrap gap-2 border-t border-border pt-3">
          <Button
            type="button"
            variant="secondary"
            className="h-11 touch-manipulation sm:h-10"
            onClick={() => void load()}
          >
            <RefreshCw className="mr-2 h-4 w-4" aria-hidden />
            Refresh
          </Button>
          <Button variant="outline" className="h-11 touch-manipulation sm:h-10" asChild>
            <Link href="/money-control?tab=rules">Money Control · rules</Link>
          </Button>
          <Button variant="outline" className="h-11 touch-manipulation sm:h-10" asChild>
            <Link href="/cash-flow">Cash flow</Link>
          </Button>
          <Button variant="outline" className="h-11 touch-manipulation sm:h-10" asChild>
            <Link href="/goals/operational">Operational goals</Link>
          </Button>
          <Button variant="outline" className="h-11 touch-manipulation sm:h-10" asChild>
            <Link href="/operational-center">Operations hub</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
