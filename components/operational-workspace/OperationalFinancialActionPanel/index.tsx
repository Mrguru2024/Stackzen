'use client';

import { useCallback, useEffect, useState } from 'react';
import type { OperationalActionListItemDto } from '@/lib/operational-actions/list-pending';
import type { OperationalActionPreviewDto } from '@/lib/operational-actions/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { ClipboardCheck, RefreshCw } from 'lucide-react';

export default function OperationalFinancialActionPanel() {
  const [items, setItems] = useState<OperationalActionListItemDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewById, setPreviewById] = useState<Record<string, OperationalActionPreviewDto | null>>({});
  const [previewLoading, setPreviewLoading] = useState<string | null>(null);
  const [applyLoading, setApplyLoading] = useState<string | null>(null);
  const [confirmA, setConfirmA] = useState<Record<string, boolean>>({});
  const [confirmB, setConfirmB] = useState<Record<string, boolean>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/operational-center/operational-actions?ensure=true', {
        credentials: 'same-origin',
      });
      if (!res.ok) throw new Error('load');
      const data = (await res.json()) as { proposals: OperationalActionListItemDto[] };
      setItems(Array.isArray(data.proposals) ? data.proposals : []);
    } catch {
      toast.error('Could not load operational actions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const runPreview = async (notificationId: string) => {
    setPreviewLoading(notificationId);
    try {
      const res = await fetch(`/api/operational-center/operational-actions/${notificationId}/preview`, {
        method: 'POST',
        credentials: 'same-origin',
      });
      const json = (await res.json().catch(() => ({}))) as OperationalActionPreviewDto | { error?: string };
      if (!res.ok) {
        toast.error(typeof json === 'object' && json && 'error' in json ? String(json.error) : 'Preview failed');
        return;
      }
      setPreviewById(prev => ({ ...prev, [notificationId]: json as OperationalActionPreviewDto }));
    } catch {
      toast.error('Preview request failed');
    } finally {
      setPreviewLoading(null);
    }
  };

  const runDismiss = async (notificationId: string) => {
    try {
      const res = await fetch(`/api/operational-center/operational-actions/${notificationId}/dismiss`, {
        method: 'POST',
        credentials: 'same-origin',
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        toast.error(j.error ?? 'Dismiss failed');
        return;
      }
      toast.success('Dismissed');
      await load();
    } catch {
      toast.error('Dismiss failed');
    }
  };

  const runApply = async (notificationId: string) => {
    setApplyLoading(notificationId);
    try {
      const res = await fetch(`/api/operational-center/operational-actions/${notificationId}/apply`, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm: true, acknowledgedImpact: true }),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string; forecastSummaryAfter?: unknown };
      if (!res.ok) {
        toast.error(json.error ?? 'Apply failed');
        return;
      }
      toast.success('Action applied · forecast refreshed');
      setPreviewById({});
      setConfirmA({});
      setConfirmB({});
      await load();
    } catch {
      toast.error('Apply failed');
    } finally {
      setApplyLoading(null);
    }
  };

  if (loading) {
    return (
      <Card className="border-dashed" id="operational-actions">
        <CardHeader>
          <CardTitle className="text-base">Operational financial actions</CardTitle>
          <CardDescription>User-approved execution only…</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-14 w-full rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border" id="operational-actions">
      <CardHeader className="space-y-1">
        <CardTitle className="flex flex-wrap items-center gap-2 text-lg">
          <ClipboardCheck className="h-5 w-5 shrink-0" aria-hidden />
          Operational financial actions
        </CardTitle>
        <CardDescription>
          Deterministic proposals from your ledger, goals, and automation rules. Nothing runs until you preview, check
          both confirmations, and choose Apply — no autonomous money movement.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No pending operational actions. Guidance and cashflow cards may
            still list review-only workflows.</p>
        ) : (
          <ul className="space-y-4">
            {items.map(item => {
              const pv = previewById[item.notificationId];
              const c1 = confirmA[item.notificationId] ?? false;
              const c2 = confirmB[item.notificationId] ?? false;
              return (
                <li
                  key={item.notificationId}
                  className="rounded-lg border border-border bg-muted/15 p-3 text-sm shadow-sm"
                >
                  <div className="space-y-1">
                    <p className="font-medium text-foreground">{item.title}</p>
                    <p className="text-muted-foreground">{item.body}</p>
                    <p className="text-xs text-muted-foreground">
                      Kind: <span className="font-mono text-foreground">{item.kind}</span>
                    </p>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      size="default"
                      className="h-11 touch-manipulation sm:h-10"
                      disabled={previewLoading === item.notificationId}
                      onClick={() => void runPreview(item.notificationId)}
                    >
                      {previewLoading === item.notificationId ? 'Preview…' : 'Preview impact'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="default"
                      className="h-11 touch-manipulation sm:h-10"
                      onClick={() => void runDismiss(item.notificationId)}
                    >
                      Dismiss
                    </Button>
                  </div>
                  {pv ? (
                    <div className="mt-3 space-y-2 rounded-md border border-border bg-background/80 p-3 text-xs">
                      <p className="font-medium text-foreground">Forecast snapshot (30d window)</p>
                      <ul className="list-inside list-disc text-muted-foreground">
                        <li>Risks: {pv.forecastSummaryBefore.riskCodes.join(', ') || '—'}</li>
                        <li>
                          Lowest projected balance:{' '}
                          {pv.forecastSummaryBefore.lowestProjectedBalance30d != null
                            ? `$${pv.forecastSummaryBefore.lowestProjectedBalance30d.toFixed(2)}`
                            : '—'}
                        </li>
                      </ul>
                      {pv.goalContributionPreview ? (
                        <p className="text-muted-foreground">
                          Bucket after suggested ${pv.goalContributionPreview.suggestedAmount.toFixed(2)}: $
                          {pv.goalContributionPreview.projectedBucketBalanceAfter.toFixed(2)}
                        </p>
                      ) : null}
                      {pv.extendGoalPreview ? (
                        <p className="text-muted-foreground">
                          Target date {pv.extendGoalPreview.previousTargetDate.slice(0, 10)} →{' '}
                          {pv.extendGoalPreview.proposedTargetDate.slice(0, 10)}
                        </p>
                      ) : null}
                      {pv.notes.map((n, i) => (
                        <p key={i} className="text-amber-700 dark:text-amber-400">
                          {n}
                        </p>
                      ))}
                      <div className="flex flex-col gap-3 border-t border-border pt-3">
                        <div className="flex items-start gap-2">
                          <Checkbox
                            id={`c1-${item.notificationId}`}
                            checked={c1}
                            onCheckedChange={v => setConfirmA(s => ({ ...s, [item.notificationId]: v === true }))}
                          />
                          <Label htmlFor={`c1-${item.notificationId}`} className="text-left font-normal leading-snug">
                            I confirm this is the operational change I intend to make.
                          </Label>
                        </div>
                        <div className="flex items-start gap-2">
                          <Checkbox
                            id={`c2-${item.notificationId}`}
                            checked={c2}
                            onCheckedChange={v => setConfirmB(s => ({ ...s, [item.notificationId]: v === true }))}
                          />
                          <Label htmlFor={`c2-${item.notificationId}`} className="text-left font-normal leading-snug">
                            I understand this updates my workspace data and will be written to the audit trail.
                          </Label>
                        </div>
                        <Button
                          type="button"
                          variant="default"
                          size="default"
                          className="h-11 w-full touch-manipulation sm:w-auto sm:max-w-xs"
                          disabled={!c1 || !c2 || applyLoading === item.notificationId}
                          onClick={() => void runApply(item.notificationId)}
                        >
                          {applyLoading === item.notificationId ? 'Applying…' : 'Apply (explicit approval)'}
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
        <Button
          type="button"
          variant="outline"
          size="default"
          className="h-11 touch-manipulation sm:h-10"
          onClick={() => void load()}
        >
          <RefreshCw className="mr-2 h-4 w-4" aria-hidden />
          Refresh
        </Button>
      </CardContent>
    </Card>
  );
}
