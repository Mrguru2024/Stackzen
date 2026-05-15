'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import type { ContractorFinancialOpsSnapshotDto } from '@/lib/contractor-operations/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Briefcase, RefreshCw } from 'lucide-react';

export interface ContractorFinancialOperationsPanelProps {
  compactSummary?: boolean;
}

export default function ContractorFinancialOperationsPanel({
  compactSummary = false,
}: ContractorFinancialOperationsPanelProps) {
  const [snap, setSnap] = useState<ContractorFinancialOpsSnapshotDto | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/operational-center/contractor-operations?ensure=true', {
        credentials: 'same-origin',
      });
      if (!res.ok) throw new Error('load');
      setSnap((await res.json()) as ContractorFinancialOpsSnapshotDto);
    } catch {
      toast.error('Could not load contractor operations');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <Card className="border-dashed" id="contractor-operations">
        <CardHeader>
          <CardTitle className="text-base">Contractor & job cash</CardTitle>
          <CardDescription>Job-linked receivables and exposure…</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-16 w-full rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  if (!snap) return null;

  if (!snap.hasContractorContext) {
    return (
      <Card className="border-dashed" id="contractor-operations">
        <CardHeader>
          <CardTitle className="text-base">Contractor & job cash</CardTitle>
          <CardDescription>No jobs or open invoices on file — contractor portfolio view is idle.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="border-border" id="contractor-operations">
      <CardHeader className="space-y-1">
        <CardTitle className="flex flex-wrap items-center gap-2 text-lg">
          <Briefcase className="h-5 w-5 shrink-0" aria-hidden />
          Contractor & job cash
        </CardTitle>
        <CardDescription>
          {compactSummary ? (
            <>
              Contractor band is in the <span className="font-medium text-foreground">command center</span>. Below:
              same job / invoice signals with less chrome.
            </>
          ) : (
            <>
              Deterministic signals from <span className="font-medium text-foreground">Job</span>,{' '}
              <span className="font-medium text-foreground">Invoice</span>, and{' '}
              <span className="font-medium text-foreground">Expense</span> rollups (same{' '}
              <span className="font-medium text-foreground">recomputeJobRevenue</span> pipeline). Operational alerts sync
              when the hub refreshes.
            </>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5 text-sm">
        {snap.materialExposure.length > 0 ? (
          <section className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
            <h3 className="font-semibold text-foreground">Material exposure (deposit gate)</h3>
            <ul className="mt-2 space-y-1 text-muted-foreground">
              {snap.materialExposure.slice(0, compactSummary ? 3 : 5).map(m => (
                <li key={m.jobId}>
                  <Link href={`/jobs/${m.jobId}`} className="font-medium text-primary underline-offset-4 hover:underline">
                    {m.title}
                  </Link>
                  {' — '}
                  expenses ${m.jobExpenses.toFixed(2)} vs deposit ${m.depositPaid.toFixed(2)} (gap $
                  {m.exposureUsd.toFixed(2)})
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {snap.negativeMarginJobs.length > 0 ? (
          <section className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
            <h3 className="font-semibold text-foreground">Negative margin (active jobs)</h3>
            <ul className="mt-2 space-y-1 text-muted-foreground">
              {snap.negativeMarginJobs.slice(0, compactSummary ? 3 : 5).map(j => (
                <li key={j.jobId}>
                  <Link href={`/jobs/${j.jobId}`} className="font-medium text-primary underline-offset-4 hover:underline">
                    {j.title}
                  </Link>
                  {' — '}
                  profit ${j.estimatedProfit.toFixed(2)} (rev ${j.jobRevenue.toFixed(2)} − exp ${j.jobExpenses.toFixed(2)})
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="space-y-2">
          <h3 className="font-semibold text-foreground">Open receivables</h3>
          <p className="text-xs text-muted-foreground">
            {snap.openReceivables.length} open · ${snap.receivableConcentration.totalOpenUsd.toFixed(2)} · HHI{' '}
            {snap.receivableConcentration.herfindahlIndex.toFixed(3)}
          </p>
          <ul className="max-h-40 space-y-1 overflow-y-auto text-xs text-muted-foreground">
            {snap.openReceivables.slice(0, compactSummary ? 5 : 8).map(inv => (
              <li key={inv.invoiceId}>
                <Link
                  href={`/invoices/${inv.invoiceId}`}
                  className="font-mono text-primary underline-offset-4 hover:underline"
                >
                  {inv.number}
                </Link>
                {inv.daysPastDue != null ? ` · ${inv.daysPastDue}d late` : ''} · ${inv.amount.toFixed(2)}
              </li>
            ))}
          </ul>
        </section>

        {snap.latePayerClients.length > 0 ? (
          <section className="space-y-2 rounded-md border border-border p-3">
            <h3 className="font-semibold text-foreground">Late payer clients (open AR)</h3>
            <p className="text-xs text-muted-foreground">
              Amount-weighted average days past due per clientId; only invoices already overdue.
            </p>
            <ul className="max-h-32 space-y-1 overflow-y-auto text-xs text-muted-foreground">
              {snap.latePayerClients.slice(0, compactSummary ? 4 : 6).map(c => (
                <li key={c.clientId}>
                  <Link
                    href={`/clients/${c.clientId}`}
                    className="font-mono text-[11px] text-primary underline-offset-4 hover:underline"
                  >
                    {c.clientId}
                  </Link>
                  {' · '}
                  {c.openOverdueCount} inv · ${c.openOverdueUsd.toFixed(2)} · ~{c.weightedAvgDaysPastDue.toFixed(0)}d
                  weighted late
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="space-y-2 rounded-md border border-dashed border-border p-3">
          <h3 className="font-semibold text-foreground">Collection timing (near-term)</h3>
          <p className="text-xs text-muted-foreground">
            Next {snap.collectionTiming.windowDays}d: {snap.collectionTiming.upcomingWithinWindowCount} open with
            dueDate in (today, +window]. Mean days-until-due{' '}
            {snap.collectionTiming.meanDaysUntilDue != null
              ? snap.collectionTiming.meanDaysUntilDue.toFixed(1)
              : '—'}
            ; stdev{' '}
            {snap.collectionTiming.stdevDaysUntilDue != null
              ? snap.collectionTiming.stdevDaysUntilDue.toFixed(1)
              : '—'}{' '}
            (higher stdev ⇒ more staggered inflows).
          </p>
          {compactSummary ? (
            <details className="text-xs text-muted-foreground">
              <summary className="cursor-pointer font-medium text-foreground">Collection reasoning (full)</summary>
              <ul className="mt-2 list-inside list-disc">
                {snap.collectionTiming.reasoning.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </details>
          ) : (
            <ul className="list-inside list-disc text-xs text-muted-foreground">
              {snap.collectionTiming.reasoning.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          )}
        </section>

        {snap.reserveNudges.length > 0 ? (
          <section className="space-y-2">
            <h3 className="font-semibold text-foreground">Reserve / liquidity nudges</h3>
            {snap.reserveNudges.map(n => (
              <div key={n.code} className="rounded-md border border-border p-2 text-xs">
                <p className="font-medium text-foreground">{n.summary}</p>
                <p className="mt-1 text-muted-foreground">{n.detail}</p>
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
            <Link href="/jobs">Jobs</Link>
          </Button>
          <Button variant="outline" className="h-11 touch-manipulation sm:h-10" asChild>
            <Link href="/invoices">Invoices</Link>
          </Button>
          <Button variant="outline" className="h-11 touch-manipulation sm:h-10" asChild>
            <Link href="/cash-flow">Cash flow</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
