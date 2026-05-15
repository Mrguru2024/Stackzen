'use client';

import Link from 'next/link';
import type { UnifiedOperationalCommandCenterDto } from '@/lib/operational-command-center/types';
import { appendOperationalHandoffToHref } from '@/lib/operational-execution-context';
import type { SerializeOperationalHandoffInput } from '@/lib/operational-execution-context';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, ArrowRight, ExternalLink, Shield } from 'lucide-react';

function bandVariant(band: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (band === 'escalating') return 'destructive';
  if (band === 'coordination') return 'secondary';
  return 'outline';
}

function bandLabel(band: string): string {
  if (band === 'escalating') return 'Needs attention';
  if (band === 'coordination') return 'Coordinate';
  return 'Stable';
}

export interface OperationalCommandCenterCardProps {
  data: UnifiedOperationalCommandCenterDto | null;
}

export default function OperationalCommandCenterCard({ data }: OperationalCommandCenterCardProps) {
  if (!data) return null;

  const { primaryCta, executionHandoff } = data.continuation;

  const primaryHref = executionHandoff
    ? appendOperationalHandoffToHref(primaryCta.href, {
        source: executionHandoff.source,
        ctaLadderStep: executionHandoff.ctaLadderStep,
        subsystem: executionHandoff.focusSubsystem,
        band: executionHandoff.focusBand,
      })
    : primaryCta.href;

  const subsystemHandoff = (s: (typeof data.subsystems)[0]): SerializeOperationalHandoffInput => ({
    source: 'command_center',
    subsystem: s.key,
    band: s.band,
  });

  return (
    <Card className="border-primary/25 bg-gradient-to-b from-primary/5 to-transparent" id="operational-command-center">
      <CardHeader className="space-y-1 pb-2">
        <CardTitle className="flex flex-wrap items-center gap-2 text-lg">
          <Shield className="h-5 w-5 shrink-0 text-primary" aria-hidden />
          Operational command center
        </CardTitle>
        <CardDescription>
          One coordinated read model across reserve, timing, contractor, and workflow — deterministic bands only, tied to
          real ledger and attention conditions.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="grid gap-4 md:grid-cols-2">
          <section className="space-y-2" aria-label="Subsystem coordination">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Subsystem rows</h3>
            <ul className="space-y-2">
              {data.subsystems.map(s => (
                <li
                  key={s.key}
                  className="flex flex-col gap-2 rounded-md border border-border/80 bg-card/60 px-3 py-2.5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-foreground">{s.label}</p>
                      <p className="text-xs text-muted-foreground">{s.headline}</p>
                    </div>
                    <Badge variant={bandVariant(s.band)} className="shrink-0 uppercase">
                      {bandLabel(s.band)}
                    </Badge>
                  </div>
                  <p className="text-[11px] leading-snug text-muted-foreground">{s.detail}</p>
                  <Link
                    href={appendOperationalHandoffToHref(s.href, subsystemHandoff(s))}
                    className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                  >
                    Open related view
                    <ExternalLink className="h-3 w-3" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section className="space-y-3" aria-label="Stabilization and next step">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Coordination focus</h3>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-xs text-muted-foreground">
                {data.coordinationBullets.map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
            </div>

            <div className="rounded-md border border-border/80 bg-muted/10 p-3">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <Activity className="h-3.5 w-3.5" aria-hidden />
                Stabilization (workflow window)
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Momentum factor count:{' '}
                <span className="font-mono text-foreground">{data.stabilization.momentumFactorCount}</span>
                {' · '}
                codes:{' '}
                <span className="font-mono text-foreground">
                  {data.stabilization.momentumFactorCodes.length
                    ? data.stabilization.momentumFactorCodes.join(', ')
                    : '—'}
                </span>
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Auto-resolved attention (window):{' '}
                <span className="font-mono text-foreground">{data.stabilization.attentionAutoResolvedInWindow}</span>
              </p>
              {data.stabilization.appliedActionKindsInWindow.length > 0 ? (
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Applied action kinds:{' '}
                  {data.stabilization.appliedActionKindsInWindow.map(k => `${k.kind}×${k.count}`).join(' · ')}
                </p>
              ) : null}
            </div>

            <div className="space-y-2 rounded-md border border-primary/30 bg-primary/5 p-3">
              <p className="text-xs font-medium text-foreground">Primary next step</p>
              <p className="text-[11px] text-muted-foreground">{primaryCta.reason}</p>
              <Button size="default" className="h-11 w-full touch-manipulation md:h-10" asChild>
                <Link href={primaryHref}>
                  {primaryCta.label}
                  <ArrowRight className="ml-2 inline h-4 w-4" aria-hidden />
                </Link>
              </Button>
              <dl className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px] text-muted-foreground sm:grid-cols-2">
                <div>
                  <dt className="inline font-medium text-foreground">Pending actions</dt>
                  <dd className="inline">: {data.continuation.pendingOperationalActionsCount}</dd>
                </div>
                <div>
                  <dt className="inline font-medium text-foreground">Shift proposals</dt>
                  <dd className="inline">: {data.continuation.pendingShiftBillProposalsCount}</dd>
                </div>
                <div>
                  <dt className="inline font-medium text-foreground">Attention queue</dt>
                  <dd className="inline">: {data.continuation.openAttentionQueueSize}</dd>
                </div>
                <div>
                  <dt className="inline font-medium text-foreground">Oldest proposal age</dt>
                  <dd className="inline">
                    :{' '}
                    {data.continuation.oldestPendingProposalAgeDays != null
                      ? `${data.continuation.oldestPendingProposalAgeDays}d`
                      : '—'}
                  </dd>
                </div>
              </dl>
            </div>
          </section>
        </div>

        <details className="rounded-md border border-border/60 bg-muted/5 p-3 text-xs text-muted-foreground">
          <summary className="cursor-pointer font-medium text-foreground">Explainability</summary>
          <p className="mt-2 font-medium text-foreground">Assumptions</p>
          <ul className="mt-1 list-disc space-y-1 pl-5">
            {data.explain.assumptions.map((a, i) => (
              <li key={`a-${i}`}>{a}</li>
            ))}
          </ul>
          <p className="mt-3 font-medium text-foreground">Contributors</p>
          <ul className="mt-1 list-disc pl-5">
            {data.explain.contributors.map((c, i) => (
              <li key={`c-${i}`}>{c}</li>
            ))}
          </ul>
        </details>
      </CardContent>
    </Card>
  );
}
