'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

type Allocation = { bucket: string; percent: number };

type FreePresetId = 'FIFTY_THIRTY_TWENTY' | 'FORTY_THIRTY_THIRTY';

interface BudgetBreakdownPayload {
  subscriptionLevel: string;
  premium: boolean;
  active: boolean;
  ruleId: string | null;
  allocations: Allocation[];
  isPresetFreeTier: boolean;
  projection: {
    lookbackDays: number;
    inflowCount: number;
    totalInflow: number;
    avgPerDeposit: number;
    avgMonthly: number;
  };
  freePresets: Record<FreePresetId, Allocation[]>;
}

export interface BudgetBreakdownEditorProps {
  /** Notify parent on successful save so it can refresh dependent panels. */
  onChange?: () => void;
}

function normalizeBucketLabel(slug: string): string {
  return slug
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, c => c.toUpperCase());
}

function roundAllocationsSumTo100(allocations: Allocation[]): Allocation[] {
  if (allocations.length === 0) return allocations;
  const sanitized = allocations.map(a => ({
    bucket: a.bucket,
    percent: Math.max(0, Number(a.percent) || 0),
  }));
  const total = sanitized.reduce((s, a) => s + a.percent, 0);
  if (total === 0) {
    sanitized[0].percent = 100;
    return sanitized;
  }
  const scaled = sanitized.map(a => ({ ...a, percent: (a.percent / total) * 100 }));
  const rounded = scaled.map(a => ({ ...a, percent: Math.round(a.percent) }));
  const diff = 100 - rounded.reduce((s, a) => s + a.percent, 0);
  if (diff !== 0) {
    rounded[0].percent += diff;
  }
  return rounded;
}

function totalPercent(allocations: Allocation[]): number {
  return allocations.reduce((s, a) => s + (Number.isFinite(a.percent) ? a.percent : 0), 0);
}

const CORE_BUCKETS = ['needs', 'wants', 'savings'] as const;

function isCoreTripleSplit(allocations: Allocation[]): boolean {
  if (allocations.length !== CORE_BUCKETS.length) return false;
  const set = new Set(allocations.map(a => a.bucket.toLowerCase()));
  return CORE_BUCKETS.every(b => set.has(b));
}

/** Stable needs → wants → savings order for the classic three-envelope split. */
function sortCoreTriple(allocations: Allocation[]): Allocation[] {
  return CORE_BUCKETS.map(bucket => {
    const row = allocations.find(a => a.bucket.toLowerCase() === bucket)!;
    return { bucket, percent: row.percent };
  });
}

function normalizeAllocationsState(list: Allocation[]): Allocation[] {
  return isCoreTripleSplit(list) ? sortCoreTriple(list) : list;
}

function projectAmounts(
  allocations: Allocation[],
  base: number
): Array<Allocation & { amount: number }> {
  return allocations.map(a => ({
    ...a,
    amount: Number(((base * a.percent) / 100).toFixed(2)),
  }));
}

function notifyAllocationResync(json: unknown) {
  const rec = json as { allocationResync?: { resynced: number; backfilled: number } | null };
  const ar = rec.allocationResync;
  if (!ar || (ar.resynced === 0 && ar.backfilled === 0)) return;
  toast.message(
    `Past deposits updated: ${ar.resynced} allocation${ar.resynced === 1 ? '' : 's'} recalculated, ${ar.backfilled} automation replay${ar.backfilled === 1 ? '' : 's'}.`
  );
}

export default function BudgetBreakdownEditor({ onChange }: BudgetBreakdownEditorProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<BudgetBreakdownPayload | null>(null);
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [active, setActive] = useState(false);
  const [draftBucket, setDraftBucket] = useState('');

  const premium = data?.premium ?? false;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/automation/budget-breakdown', { credentials: 'same-origin' });
      if (!res.ok) throw new Error('Failed to load');
      const json = (await res.json()) as BudgetBreakdownPayload;
      setData(json);
      const fallback = json.freePresets.FIFTY_THIRTY_TWENTY;
      let initial = json.premium && json.allocations.length > 0 ? json.allocations : fallback;
      if (json.premium && isCoreTripleSplit(initial)) {
        initial = normalizeAllocationsState(initial);
      }
      setAllocations(initial);
      setActive(json.active);
    } catch {
      toast.error('Could not load budget breakdown.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const total = useMemo(() => totalPercent(allocations), [allocations]);
  const sumValid = Math.abs(total - 100) <= 0.05;

  const dollarPreview = useMemo(
    () => projectAmounts(allocations, data?.projection.avgPerDeposit ?? 0),
    [allocations, data?.projection.avgPerDeposit]
  );
  const monthlyPreview = useMemo(
    () => projectAmounts(allocations, data?.projection.avgMonthly ?? 0),
    [allocations, data?.projection.avgMonthly]
  );

  const applyPresetPro = (preset: FreePresetId) => {
    if (!data || !premium) return;
    setAllocations(normalizeAllocationsState(data.freePresets[preset]));
  };

  const adjustPercent = (index: number, value: number) => {
    if (!premium) return;
    setAllocations(prev => prev.map((row, idx) => (idx === index ? { ...row, percent: value } : row)));
  };

  const adjustPercentForBucket = (bucket: string, value: number) => {
    if (!premium) return;
    const key = bucket.toLowerCase();
    setAllocations(prev =>
      prev.map(row => (row.bucket.toLowerCase() === key ? { ...row, percent: value } : row))
    );
  };

  const removeAllocation = (index: number) => {
    if (!premium) return;
    setAllocations(prev => normalizeAllocationsState(prev.filter((_, idx) => idx !== index)));
  };

  const addAllocation = () => {
    if (!premium) return;
    const cleaned = draftBucket.trim().toLowerCase().replace(/\s+/g, '_');
    if (!cleaned) {
      toast.error('Envelope name is required.');
      return;
    }
    if (allocations.some(a => a.bucket === cleaned)) {
      toast.error('That envelope is already in the split.');
      return;
    }
    setAllocations(prev => normalizeAllocationsState([...prev, { bucket: cleaned, percent: 0 }]));
    setDraftBucket('');
  };

  const autoBalance = () => {
    if (!premium) return;
    setAllocations(prev => normalizeAllocationsState(roundAllocationsSumTo100(prev)));
  };

  const saveProActive = async (nextActive: boolean) => {
    if (!data) return;
    if (nextActive && !sumValid) {
      toast.error('Percentages must total 100% before activating.');
      return;
    }
    setSaving(true);
    try {
      const payload: Record<string, unknown> = { active: nextActive };
      if (nextActive) {
        payload.customAllocations = allocations.map(a => ({ bucket: a.bucket, percent: a.percent }));
      }
      const res = await fetch('/api/automation/budget-breakdown', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error((json as { error?: string }).error ?? 'Save failed');
      }
      toast.success(nextActive ? 'Auto-split activated.' : 'Auto-split turned off.');
      notifyAllocationResync(json);
      setActive(nextActive);
      await load();
      onChange?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const toggleFreeActive = async (nextActive: boolean) => {
    if (!data) return;
    setSaving(true);
    try {
      const payload: Record<string, unknown> = { active: nextActive };
      if (nextActive) {
        payload.preset = 'FIFTY_THIRTY_TWENTY';
      }
      const res = await fetch('/api/automation/budget-breakdown', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error((json as { error?: string }).error ?? 'Save failed');
      }
      toast.success(nextActive ? 'Auto-split activated.' : 'Auto-split turned off.');
      notifyAllocationResync(json);
      setActive(nextActive);
      await load();
      onChange?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Budget breakdown</CardTitle>
          <CardDescription>Loading your current split…</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!premium) {
    // Free tier: fixed 50 / 30 / 20 split, on/off toggle only, no editing of any kind.
    const fixed = data.freePresets.FIFTY_THIRTY_TWENTY;
    const freeDollars = projectAmounts(fixed, data.projection.avgPerDeposit);
    const freeMonthly = projectAmounts(fixed, data.projection.avgMonthly);

    return (
      <Card>
        <CardHeader className="space-y-2">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                Budget breakdown
                <Badge variant="outline">Free plan</Badge>
              </CardTitle>
              <CardDescription>
                Your plan uses the 50 / 30 / 20 split: 50% to needs, 30% to wants, 20% to savings. When auto-split is on,
                every paycheck, direct deposit, gig payout, and contractor payment is routed automatically. Turn it off
                anytime.
              </CardDescription>
            </div>
            <label className="flex items-center gap-2 text-sm font-medium">
              Auto-split is {active ? 'on' : 'off'}
              <Switch
                checked={active}
                onCheckedChange={checked => void toggleFreeActive(checked)}
                disabled={saving}
                aria-label="Toggle auto-split"
              />
            </label>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {fixed.map((row, idx) => (
              <div key={row.bucket} className="rounded-lg border p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium">{normalizeBucketLabel(row.bucket)}</p>
                    <p className="text-xs text-muted-foreground">Envelope · {row.bucket}</p>
                  </div>
                  <span className="text-sm font-semibold">{row.percent}%</span>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <div>
                    Per deposit:{' '}
                    <span className="font-medium text-foreground">
                      ${freeDollars[idx]?.amount?.toFixed(2) ?? '0.00'}
                    </span>
                  </div>
                  <div>
                    Per month:{' '}
                    <span className="font-medium text-foreground">
                      ${freeMonthly[idx]?.amount?.toFixed(2) ?? '0.00'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-md border bg-muted/30 p-3 text-xs text-muted-foreground">
            Estimates use {data.projection.inflowCount} income deposits from the last {data.projection.lookbackDays} days
            (avg ${data.projection.avgPerDeposit.toFixed(2)} per deposit, ${data.projection.avgMonthly.toFixed(2)} per
            month). Transfers between your own accounts are skipped automatically.
          </div>

          <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-200">
            Need to add envelopes (taxes, emergency, debt payoff) or change the percentages? Pro unlocks custom budget
            settings.
          </div>
        </CardContent>
      </Card>
    );
  }

  const coreTriple = isCoreTripleSplit(allocations);

  // Pro tier: full editor (sliders, custom envelopes, auto-balance, save/activate).
  return (
    <Card>
      <CardHeader className="space-y-2">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              Budget breakdown
              <Badge variant="secondary">Pro</Badge>
            </CardTitle>
            <CardDescription>
              Pick how income deposits are sliced into envelopes. When active, every paycheck, direct deposit, gig
              payout, and contractor payment is split automatically as it lands. Turn it off any time.
            </CardDescription>
          </div>
          <label className="flex items-center gap-2 text-sm font-medium">
            Auto-split is {active ? 'on' : 'off'}
            <Switch
              checked={active}
              onCheckedChange={checked => void saveProActive(checked)}
              disabled={saving}
              aria-label="Toggle auto-split"
            />
          </label>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm dark:bg-primary/10">
          <p className="font-medium text-foreground">You are not limited to two presets</p>
          <p className="mt-1 text-muted-foreground">
            The 50/30/20 and 40/30/30 buttons are <strong className="text-foreground">optional templates</strong> only.
            Enter <strong className="text-foreground">any percentages that total 100%</strong> (use the fields below,
            sliders, or <span className="whitespace-nowrap">Auto-balance to 100%</span>). Add extra envelopes anytime.
          </p>
        </div>

        {coreTriple ? (
          <div className="space-y-3 rounded-lg border p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-medium">Custom split — needs, wants, savings</p>
              <Badge variant={sumValid ? 'secondary' : 'destructive'}>
                Total {total.toFixed(0)}%{sumValid ? ' · OK' : ' · need 100%'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Type your own three-way split. It does not have to match either template.
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {CORE_BUCKETS.map(b => {
                const pct = allocations.find(a => a.bucket.toLowerCase() === b)?.percent ?? 0;
                return (
                  <div key={b} className="space-y-1.5">
                    <Label htmlFor={`core-pct-${b}`}>{normalizeBucketLabel(b)}</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id={`core-pct-${b}`}
                        type="number"
                        className="w-full min-w-0 sm:max-w-[120px]"
                        value={pct}
                        min={0}
                        max={100}
                        step={1}
                        onChange={e => adjustPercentForBucket(b, Number(e.target.value))}
                        aria-label={`Percent for ${b}`}
                      />
                      <span className="shrink-0 text-sm text-muted-foreground">%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

        <div className="space-y-4">
          {allocations.map((row, idx) => (
            <div key={row.bucket} className="rounded-lg border p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-medium">{normalizeBucketLabel(row.bucket)}</p>
                  <p className="text-xs text-muted-foreground">Envelope · {row.bucket}</p>
                </div>
                <div className="flex items-center gap-3">
                  {!coreTriple ? (
                    <>
                      <Input
                        type="number"
                        className="w-20"
                        value={row.percent}
                        min={0}
                        max={100}
                        step={1}
                        onChange={e => adjustPercent(idx, Number(e.target.value))}
                        aria-label={`Percent for ${row.bucket}`}
                      />
                      <span className="text-sm font-medium">%</span>
                    </>
                  ) : (
                    <span className="text-sm font-semibold tabular-nums">{row.percent}%</span>
                  )}
                  {allocations.length > 1 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeAllocation(idx)}
                      type="button"
                      aria-label={`Remove ${row.bucket}`}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              </div>
              <Slider
                className="mt-3"
                value={[Math.max(0, Math.min(100, row.percent))]}
                onValueChange={([next]) => adjustPercent(idx, next)}
                min={0}
                max={100}
                step={1}
                aria-label={`Slider for ${row.bucket}`}
              />
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <div>
                  Per deposit:{' '}
                  <span className="font-medium text-foreground">
                    ${dollarPreview[idx]?.amount?.toFixed(2) ?? '0.00'}
                  </span>
                </div>
                <div>
                  Per month:{' '}
                  <span className="font-medium text-foreground">
                    ${monthlyPreview[idx]?.amount?.toFixed(2) ?? '0.00'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-end gap-2">
          <div className="flex-1 min-w-[200px]">
            <Label htmlFor="add-envelope">Add an envelope</Label>
            <Input
              id="add-envelope"
              placeholder="e.g. taxes, emergency, debt_payoff"
              value={draftBucket}
              onChange={e => setDraftBucket(e.target.value)}
            />
          </div>
          <Button type="button" variant="outline" onClick={addAllocation}>
            Add envelope
          </Button>
          <Button type="button" variant="outline" onClick={autoBalance}>
            Auto-balance to 100%
          </Button>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Popular templates (optional)
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={isAllocationEqual(allocations, data.freePresets.FIFTY_THIRTY_TWENTY) ? 'default' : 'outline'}
              onClick={() => applyPresetPro('FIFTY_THIRTY_TWENTY')}
              type="button"
            >
              Use 50 / 30 / 20
            </Button>
            <Button
              size="sm"
              variant={isAllocationEqual(allocations, data.freePresets.FORTY_THIRTY_THIRTY) ? 'default' : 'outline'}
              onClick={() => applyPresetPro('FORTY_THIRTY_THIRTY')}
              type="button"
            >
              Use 40 / 30 / 30
            </Button>
          </div>
        </div>

        <div className="rounded-md border bg-muted/30 p-3 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              Total{' '}
              <span className={sumValid ? 'font-semibold text-emerald-600' : 'font-semibold text-destructive'}>
                {total.toFixed(0)}%
              </span>{' '}
              · {data.projection.inflowCount} income deposits in the last {data.projection.lookbackDays} days · avg per
              deposit ${data.projection.avgPerDeposit.toFixed(2)}
            </div>
            {!sumValid && <Badge variant="destructive">Must total 100%</Badge>}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            When this is on, deposits classified as paycheck, direct deposit, gig payout, or contractor payment are
            split across the envelopes above. Transfers between your own accounts are skipped automatically.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={() => void saveProActive(true)} disabled={saving || !sumValid}>
            {active ? 'Save changes' : 'Activate auto-split'}
          </Button>
          {active && (
            <Button variant="outline" onClick={() => void saveProActive(false)} disabled={saving}>
              Turn off auto-split
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function isAllocationEqual(a: Allocation[], b: Allocation[]): boolean {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort((x, y) => x.bucket.localeCompare(y.bucket));
  const sortedB = [...b].sort((x, y) => x.bucket.localeCompare(y.bucket));
  return sortedA.every((row, idx) => row.bucket === sortedB[idx].bucket && row.percent === sortedB[idx].percent);
}
