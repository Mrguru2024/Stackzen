'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import type { WorkflowResolutionSnapshotDto } from '@/lib/workflow-resolution/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { CheckCircle2, RefreshCw } from 'lucide-react';

const KIND_LABEL: Record<string, string> = {
  PAUSE_AUTOMATION_RULE: 'Allocation rule paused',
  RECORD_GOAL_CONTRIBUTION: 'Goal contribution recorded',
  EXTEND_GOAL_TARGET_DATE: 'Goal deadline extended',
  SHIFT_RECURRING_BILL_DATE: 'Recurring bill date shifted',
  PREPARE_RESERVE_FOR_OBLIGATION: 'Reserve prep recorded',
};

export interface WorkflowResolutionPanelProps {
  compactSummary?: boolean;
}

export default function WorkflowResolutionPanel({ compactSummary = false }: WorkflowResolutionPanelProps) {
  const [snap, setSnap] = useState<WorkflowResolutionSnapshotDto | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/operational-center/workflow-resolution?windowDays=14', {
        credentials: 'same-origin',
      });
      if (!res.ok) throw new Error('load');
      setSnap((await res.json()) as WorkflowResolutionSnapshotDto);
    } catch {
      toast.error('Could not load workflow resolution');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <Card className="border-dashed" id="workflow-resolution">
        <CardHeader>
          <CardTitle className="text-base">Workflow resolution</CardTitle>
          <CardDescription>Operational follow-through history…</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-16 w-full rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  if (!snap) return null;

  const oldestPendingHref = snap.openAttention.oldestPendingProposalNotificationId
    ? '/operational-center#operational-actions'
    : '/operational-center';

  return (
    <Card className="border-border" id="workflow-resolution">
      <CardHeader className="space-y-1">
        <CardTitle className="flex flex-wrap items-center gap-2 text-lg">
          <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden />
          Workflow resolution & follow-through
        </CardTitle>
        <CardDescription>
          {compactSummary ? (
            <>
              Follow-through counts are echoed in the <span className="font-medium text-foreground">command center</span>.
              Expand sections below for full <span className="font-medium text-foreground">FinancialEvent</span> context.
            </>
          ) : (
            <>
              Audit-derived view of corrective work over the last{' '}
              <span className="font-medium text-foreground">{snap.windowDays}</span> day(s). Sourced from{' '}
              <span className="font-medium text-foreground">FinancialEvent</span> rows and{' '}
              <span className="font-medium text-foreground">AutomationNotification</span> metadata. No streaks, no badges,
              no auto-pushed reinforcement.
            </>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5 text-sm">
        <section className="rounded-md border border-border bg-muted/10 p-3">
          <p className="text-xs text-muted-foreground">
            Recommendations issued: <span className="font-mono text-foreground">{snap.recommendationsIssuedInWindow}</span> ·
            Applied:{' '}
            <span className="font-mono text-foreground">
              {snap.appliedActions.reduce((s, a) => s + a.count, 0)}
            </span>{' '}
            · Dismissed: <span className="font-mono text-foreground">{snap.dismissedActionCount}</span> ·
            Auto-resolved attention:{' '}
            <span className="font-mono text-foreground">{snap.attentionAutoResolvedInWindow}</span>
          </p>
          <p className="mt-2 font-semibold text-foreground">
            momentumFactorCount = {snap.momentumFactorCount} / 5
          </p>
        </section>

        {snap.factors.length > 0 ? (
          <section className="space-y-2">
            <h3 className="font-semibold text-foreground">Follow-through factors</h3>
            {compactSummary ? (
              <ul className="space-y-1 text-xs text-muted-foreground">
                {snap.factors.map(f => (
                  <li key={f.code} className="rounded border border-border/80 px-2 py-1">
                    <span className="font-mono text-[11px] text-foreground">{f.code}</span>
                    <span className="text-foreground"> — {f.summary}</span>
                  </li>
                ))}
              </ul>
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
          <p className="text-xs text-muted-foreground">
            No follow-through events recorded in the last {snap.windowDays} day(s). Nothing to celebrate yet — open the
            operational actions hub to review pending recommendations.
          </p>
        )}

        {snap.appliedActions.length > 0 ? (
          <section className="space-y-2 rounded-md border border-border p-3 text-xs">
            <h3 className="font-semibold text-foreground">Applied actions by kind</h3>
            <ul className="mt-1 space-y-2 text-muted-foreground">
              {(compactSummary ? snap.appliedActions.slice(0, 3) : snap.appliedActions).map(a => {
                const delta = a.latestBalanceDelta;
                const lowDelta = delta?.lowestProjectedBalanceDeltaUsd ?? null;
                const endDelta = delta?.projectedEndingBalanceDeltaUsd ?? null;
                return (
                  <li key={a.kind} className="rounded border border-border/80 p-2">
                    <p>
                      <span className="text-foreground">{KIND_LABEL[a.kind] ?? a.kind}</span>: {a.count} ·{' '}
                      {a.oldestForecastBeforeAt
                        ? `forecasts from ${a.oldestForecastBeforeAt.slice(0, 10)}`
                        : 'no before-forecast'}
                      {a.newestForecastAfterAt ? ` → ${a.newestForecastAfterAt.slice(0, 10)}` : ''}
                    </p>
                    {delta ? (
                      <p className="mt-1 text-[11px]">
                        Latest deterministic forecast delta · lowest projected balance{' '}
                        <span className="font-mono text-foreground">
                          ${delta.forecastSummaryBefore.lowestProjectedBalance30d?.toFixed(2) ?? 'n/a'}
                        </span>{' '}
                        →{' '}
                        <span className="font-mono text-foreground">
                          ${delta.forecastSummaryAfter.lowestProjectedBalance30d?.toFixed(2) ?? 'n/a'}
                        </span>
                        {lowDelta != null ? (
                          <span className={lowDelta >= 0 ? 'ml-1 text-emerald-600 dark:text-emerald-400' : 'ml-1 text-amber-600 dark:text-amber-400'}>
                            ({lowDelta >= 0 ? '+' : ''}${lowDelta.toFixed(2)})
                          </span>
                        ) : null}
                        {endDelta != null ? (
                          <>
                            {' '}
                            · projected ending{' '}
                            <span className={endDelta >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}>
                              {endDelta >= 0 ? '+' : ''}${endDelta.toFixed(2)}
                            </span>
                          </>
                        ) : null}
                      </p>
                    ) : (
                      <p className="mt-1 text-[11px] italic">No balance delta captured (event predates summary persistence).</p>
                    )}
                  </li>
                );
              })}
            </ul>
            {compactSummary && snap.appliedActions.length > 3 ? (
              <p className="mt-2 text-[11px] text-muted-foreground">
                +{snap.appliedActions.length - 3} more kind(s) — open the audit timeline for the full set.
              </p>
            ) : null}
          </section>
        ) : null}

        {snap.goalContributions.count > 0 ? (
          <section className="space-y-1 rounded-md border border-border p-3 text-xs">
            <h3 className="font-semibold text-foreground">Goal contributions in window</h3>
            <p className="text-muted-foreground">
              {snap.goalContributions.count} contribution(s) · ${snap.goalContributions.totalUsd.toFixed(2)} total ·{' '}
              {snap.goalContributions.goalsTouched} goal(s) ·{' '}
              {snap.goalContributions.milestoneCount} milestone(s) reached
            </p>
          </section>
        ) : null}

        <section className="rounded-md border border-dashed border-border p-3 text-xs text-muted-foreground">
          <h3 className="font-semibold text-foreground">Open attention right now</h3>
          <p className="mt-1">
            Queue size: <span className="font-mono text-foreground">{snap.openAttention.queueSize}</span>
            {snap.openAttention.oldestPendingProposalAgeDays != null ? (
              <>
                {' '}
                · Oldest pending operational action:{' '}
                <span className="font-mono text-foreground">{snap.openAttention.oldestPendingProposalAgeDays}d old</span>
              </>
            ) : null}
          </p>
        </section>

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
            <Link href={oldestPendingHref}>Operations hub</Link>
          </Button>
          <Button variant="outline" className="h-11 touch-manipulation sm:h-10" asChild>
            <Link href="/financial-timeline">Audit timeline</Link>
          </Button>
          <Button variant="outline" className="h-11 touch-manipulation sm:h-10" asChild>
            <Link href="/goals/operational">Operational goals</Link>
          </Button>
          <Button variant="outline" className="h-11 touch-manipulation sm:h-10" asChild>
            <Link href="/money-control?tab=review">Money Control</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
