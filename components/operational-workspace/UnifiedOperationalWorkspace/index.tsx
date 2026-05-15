'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import type { OperationalAlertDto, OperationalAlertsResponseDto } from '@/lib/operational-notifications/types';
import { OperationalAlertCards } from '@/components/operational-center/OperationalAlertCards';
import { dedupeOperationalAlerts, rankOperationalAlerts } from '@/lib/workspace/priority-engine';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { ArrowRight, ClipboardList, LineChart, Target, Wallet } from 'lucide-react';
import { useOperationalAttentionRealtime } from '@/hooks/useOperationalAttentionRealtime';
import type { OperationalCheckpointPayload } from '@/lib/operational-state/checkpoint-payload';
import OperationalActivationPanel from '@/components/operational-workspace/OperationalActivationPanel';
import ConnectedFinancialOperationsPanel from '@/components/operational-workspace/ConnectedFinancialOperationsPanel';
import SmartIncomeIntelligencePanel from '@/components/operational-workspace/SmartIncomeIntelligencePanel';
import OperationalFinancialActionPanel from '@/components/operational-workspace/OperationalFinancialActionPanel';
import ContractorFinancialOperationsPanel from '@/components/operational-workspace/ContractorFinancialOperationsPanel';
import ReserveAllocationIntelligencePanel from '@/components/operational-workspace/ReserveAllocationIntelligencePanel';
import WorkflowResolutionPanel from '@/components/operational-workspace/WorkflowResolutionPanel';
import TimingCoordinationPanel from '@/components/operational-workspace/TimingCoordinationPanel';
import OperationalCommandCenterCard from '@/components/operational-workspace/OperationalCommandCenterCard';

type ActivationPayload = {
  profiles?: string[];
};

function buildAdaptiveShortcuts(profileTypes: string[]): { href: string; label: string; description: string }[] {
  const s = new Set(profileTypes.map(p => p.toUpperCase()));
  const contractorLike = s.has('CONTRACTOR') || s.has('FREELANCE') || s.has('BUSINESS');

  const core: { href: string; label: string; description: string }[] = [
    {
      href: '/money-control?tab=review',
      label: 'Review ledger',
      description: 'Categorize, fix allocations, clear review queue',
    },
    {
      href: '/cash-flow',
      label: 'Cash flow',
      description: 'Deterministic forecast and bill timing',
    },
    {
      href: '/goals/operational',
      label: 'Goals',
      description: 'Pace, contribute, bucket-backed progress',
    },
    {
      href: '/financial-timeline',
      label: 'Timeline',
      description: 'FinancialEvent audit trail',
    },
  ];

  if (contractorLike) {
    return [
      {
        href: '/invoices',
        label: 'Invoices',
        description: 'Receivables and follow-ups',
      },
      {
        href: '/jobs',
        label: 'Jobs',
        description: 'Deposits and delivery status',
      },
      ...core,
      {
        href: '/money-control?tab=rules',
        label: 'Automation rules',
        description: 'Adjust allocation envelopes',
      },
    ];
  }

  return [
    ...core,
    {
      href: '/money-control?tab=rules',
      label: 'Automation rules',
      description: 'Allocation and guardrails',
    },
  ];
}

export interface UnifiedOperationalWorkspaceProps {
  embedded?: boolean;
  /**
   * When true (default), intelligence panels use shorter summaries and fold long context into
   * `<details>` because the Operational command center already surfaces coordinated bands.
   */
  compactIntelligencePanels?: boolean;
}

export default function UnifiedOperationalWorkspace({
  embedded = false,
  compactIntelligencePanels = true,
}: UnifiedOperationalWorkspaceProps) {
  const { data: session } = useSession();
  const [alerts, setAlerts] = useState<OperationalAlertDto[]>([]);
  const [commandCenter, setCommandCenter] = useState<OperationalAlertsResponseDto['commandCenter']>(undefined);
  const [profiles, setProfiles] = useState<string[]>([]);
  const [checkpoint, setCheckpoint] = useState<OperationalCheckpointPayload | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [alRes, actRes, cpRes] = await Promise.all([
        fetch('/api/operational-center/alerts?ensure=true&includeCommandCenter=true', {
          credentials: 'same-origin',
        }),
        fetch('/api/income-profiles/activation', { credentials: 'same-origin' }),
        fetch('/api/operational-center/checkpoint', { credentials: 'same-origin' }),
      ]);
      if (!alRes.ok) throw new Error('alerts');
      const data = (await alRes.json()) as OperationalAlertsResponseDto;
      setAlerts(data.alerts);
      setCommandCenter(data.commandCenter);
      if (actRes.ok) {
        const act = (await actRes.json()) as ActivationPayload;
        setProfiles(Array.isArray(act.profiles) ? act.profiles : []);
      }
      if (cpRes.ok) {
        const cp = (await cpRes.json()) as { payload?: unknown };
        if (cp.payload && typeof cp.payload === 'object' && !Array.isArray(cp.payload)) {
          setCheckpoint(cp.payload as OperationalCheckpointPayload);
        }
      }
    } catch {
      toast.error('Could not load operations workspace');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useOperationalAttentionRealtime({
    userId: session?.user?.id,
    onOperationalChange: load,
  });

  const ranked = useMemo(() => {
    const deduped = dedupeOperationalAlerts(alerts);
    return rankOperationalAlerts(deduped, { incomeProfileTypes: profiles });
  }, [alerts, profiles]);

  const attentionItems = useMemo(
    () => ranked.filter(a => a.inAttentionQueue && !a.suppressed),
    [ranked]
  );

  const shortcuts = useMemo(() => buildAdaptiveShortcuts(profiles), [profiles]);

  return (
    <div className="space-y-5 md:space-y-8">
      {!embedded ? (
        <header className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Operations hub</h1>
          <p className="max-w-3xl text-sm text-muted-foreground md:text-base">
            One prioritized queue across money, guidance, goals, invoices, and jobs. Every card links to a real
            workflow — not a passive dashboard.
          </p>
          <p className="text-sm font-medium text-foreground">
            {loading ? '…' : `${attentionItems.length} item(s) in your attention queue`}
          </p>
        </header>
      ) : null}

      <OperationalCommandCenterCard data={commandCenter ?? null} />

      <ConnectedFinancialOperationsPanel />

      <SmartIncomeIntelligencePanel />

      <ContractorFinancialOperationsPanel compactSummary={compactIntelligencePanels} />

      <OperationalFinancialActionPanel />

      <ReserveAllocationIntelligencePanel compactSummary={compactIntelligencePanels} />

      <WorkflowResolutionPanel compactSummary={compactIntelligencePanels} />

      <TimingCoordinationPanel compactSummary={compactIntelligencePanels} />

      <OperationalActivationPanel />

      {checkpoint?.moneyControl?.financialTransactionId ? (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Resume ledger review</CardTitle>
            <CardDescription>
              You have an in-progress transaction review in Money Control. Continue where you left off.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="default" size="default" className="h-11 w-full touch-manipulation sm:h-10 sm:w-auto" asChild>
              <Link
                href={`/money-control?tab=review&txnId=${checkpoint.moneyControl.financialTransactionId}`}
              >
                Open transaction <ArrowRight className="ml-1 inline h-3 w-3" aria-hidden />
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ClipboardList className="h-5 w-5" aria-hidden />
            Workflow continuity
          </CardTitle>
          <CardDescription>
            Operational loop: triage → correct in Money Control → confirm in Cash Flow or Goals → mark read or
            applied here.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap">
          <Button variant="outline" size="default" className="h-11 w-full touch-manipulation sm:h-10 sm:w-auto" asChild>
            <Link href="/money-control?tab=review">
              1 · Review <ArrowRight className="ml-1 inline h-3 w-3" aria-hidden />
            </Link>
          </Button>
          <Button variant="outline" size="default" className="h-11 w-full touch-manipulation sm:h-10 sm:w-auto" asChild>
            <Link href="/money-control?tab=rules">
              2 · Correct rules / buckets <ArrowRight className="ml-1 inline h-3 w-3" aria-hidden />
            </Link>
          </Button>
          <Button variant="outline" size="default" className="h-11 w-full touch-manipulation sm:h-10 sm:w-auto" asChild>
            <Link href="/cash-flow">
              3 · Confirm timing <ArrowRight className="ml-1 inline h-3 w-3" aria-hidden />
            </Link>
          </Button>
          <Button
            variant="secondary"
            size="default"
            type="button"
            className="h-11 w-full touch-manipulation sm:h-10 sm:w-auto"
            disabled={loading}
            onClick={() => void load()}
          >
            Refresh queue
          </Button>
        </CardContent>
      </Card>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">Adaptive shortcuts</h2>
        <p className="text-sm text-muted-foreground">
          Based on your active income profile(s): {profiles.length ? profiles.join(', ') : 'loading…'}
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {shortcuts.map(s => (
            <Link
              key={s.href + s.label}
              href={s.href}
              className="flex min-h-[44px] flex-col justify-center rounded-lg border border-border bg-card p-4 shadow-sm transition-colors hover:bg-accent/40 touch-manipulation active:bg-accent/50"
            >
              <div className="flex items-center gap-2 font-medium text-foreground">
                {s.label.includes('Cash') ? (
                  <LineChart className="h-4 w-4" aria-hidden />
                ) : s.label.includes('Goals') ? (
                  <Target className="h-4 w-4" aria-hidden />
                ) : (
                  <Wallet className="h-4 w-4" aria-hidden />
                )}
                {s.label}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{s.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <section id="operational-attention" className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">Prioritized attention queue</h2>
        <p className="text-sm text-muted-foreground">
          Duplicate forecast signals (e.g. cashflow + guidance for the same risk code) are collapsed to a single card
          when safe.
        </p>
        {loading ? (
          <div className="space-y-3" aria-busy="true" aria-label="Loading attention queue">
            <Skeleton className="h-24 w-full rounded-lg" />
            <Skeleton className="h-24 w-full rounded-lg" />
            <Skeleton className="h-20 w-full rounded-lg sm:max-w-md" />
          </div>
        ) : (
          <OperationalAlertCards items={ranked} onMutate={load} />
        )}
      </section>
    </div>
  );
}
