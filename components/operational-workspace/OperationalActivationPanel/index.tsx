'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import type { AdaptiveActivationResponseDto, DerivedActivationSteps } from '@/lib/operational-activation/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { CheckCircle2, Circle, ListChecks, Sparkles, X } from 'lucide-react';

type ActivationRowKey = Exclude<keyof DerivedActivationSteps, 'evidence'>;

const STEP_LABELS: Array<{ key: ActivationRowKey; label: string }> = [
  { key: 'income_profile_selected', label: 'Income profile saved' },
  { key: 'bank_linked', label: 'Bank connection active' },
  { key: 'ledger_populated', label: 'Ledger has transactions' },
  { key: 'transactions_categorized', label: 'Categories applied (3+ rows)' },
  { key: 'envelopes_or_automation', label: 'Allocations or automation rules' },
  { key: 'forecast_engaged', label: 'Cash flow forecast used' },
  { key: 'operational_goal_created', label: 'Operational goal created' },
  { key: 'attention_queue_engaged', label: 'Operational alert triaged' },
];

async function patchDismiss(key: string) {
  const res = await fetch('/api/operational-center/checkpoint', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ activation: { dismissedNbaKeys: [key] } }),
    credentials: 'same-origin',
  });
  if (!res.ok) throw new Error('checkpoint');
}

export default function OperationalActivationPanel() {
  const [data, setData] = useState<AdaptiveActivationResponseDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [recording, setRecording] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/operational-center/adaptive-activation', { credentials: 'same-origin' });
      if (!res.ok) throw new Error('load');
      setData((await res.json()) as AdaptiveActivationResponseDto);
    } catch {
      toast.error('Could not load activation status');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const recordMilestones = async () => {
    setRecording(true);
    try {
      const res = await fetch('/api/operational-center/adaptive-activation/record-milestones', {
        method: 'POST',
        credentials: 'same-origin',
      });
      if (!res.ok) throw new Error('record');
      const json = (await res.json()) as { newlyRecorded?: string[] };
      const n = json.newlyRecorded?.length ?? 0;
      toast.success(n ? `Recorded ${n} milestone(s) to your audit log.` : 'No new milestones to record.');
      await load();
    } catch {
      toast.error('Could not record milestones');
    } finally {
      setRecording(false);
    }
  };

  const dismiss = async (key: string) => {
    try {
      await patchDismiss(key);
      await load();
    } catch {
      toast.error('Could not dismiss suggestion');
    }
  };

  if (loading || !data) {
    return (
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-base">Operational readiness</CardTitle>
          <CardDescription>Loading…</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const doneCount = STEP_LABELS.filter(s => data.derivedSteps[s.key]).length;

  return (
    <Card className="border-border">
      <CardHeader className="space-y-1">
        <CardTitle className="flex items-center gap-2 text-lg">
          <ListChecks className="h-5 w-5 shrink-0" aria-hidden />
          Operational readiness
        </CardTitle>
        <CardDescription>
          Derived from your ledger, bank links, goals, and attention queue — not a passive tour. Tier{' '}
          <span className="font-medium text-foreground">{data.progressiveTier}</span> of 3 · {doneCount}/
          {STEP_LABELS.length} core signals complete.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <ul className="grid gap-2 text-sm sm:grid-cols-2">
          {STEP_LABELS.map(row => {
            const ok = Boolean(data.derivedSteps[row.key]);
            return (
              <li key={row.key} className="flex items-center gap-2 text-foreground">
                {ok ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
                ) : (
                  <Circle className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                )}
                <span className={ok ? 'text-muted-foreground line-through decoration-muted-foreground/60' : ''}>
                  {row.label}
                </span>
              </li>
            );
          })}
        </ul>

        {data.nextActions.length > 0 ? (
          <div className="space-y-3">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Sparkles className="h-4 w-4" aria-hidden />
              Next best actions
            </h3>
            <ul className="space-y-3">
              {data.nextActions.map(a => (
                <li
                  key={a.key}
                  className="flex flex-col gap-2 rounded-lg border border-border bg-muted/30 p-3 sm:flex-row sm:items-start sm:justify-between"
                >
                  <div className="space-y-1">
                    <p className="font-medium text-foreground">{a.title}</p>
                    <p className="text-xs text-muted-foreground">{a.body}</p>
                    <Button
                      variant="default"
                      size="default"
                      className="mt-1 h-11 w-full touch-manipulation sm:h-10 sm:w-auto"
                      asChild
                    >
                      <Link href={a.href}>Open workflow</Link>
                    </Button>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-11 w-11 shrink-0 touch-manipulation self-end sm:self-start"
                    aria-label={`Dismiss ${a.title}`}
                    onClick={() => void dismiss(a.key)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Core activation loop is complete. Keep using Operations hub and Money Control as your cash rhythm changes.
          </p>
        )}

        <div className="flex flex-col gap-2 border-t border-border pt-4 sm:flex-row sm:flex-wrap">
          <Button
            type="button"
            variant="secondary"
            size="default"
            className="h-11 w-full touch-manipulation sm:h-10 sm:w-auto"
            disabled={recording}
            onClick={() => void recordMilestones()}
          >
            {recording ? 'Recording…' : 'Write milestones to audit log'}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="default"
            className="h-11 w-full touch-manipulation sm:h-10 sm:w-auto"
            onClick={() => void load()}
          >
            Refresh
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
