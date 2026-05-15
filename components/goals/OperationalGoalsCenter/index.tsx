'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { GoalAnalysisDto } from '@/lib/goals/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

type GoalListItem = {
  id: string;
  name: string;
  description: string | null;
  goalKind: string;
  targetAmount: number;
  targetDate: string | null;
  smartBucketId: string;
  bucketName: string;
  bucketBalance: number;
  automationMode: string;
  priority: number;
  status: string;
  lastContributionAt: string | null;
  analysis: GoalAnalysisDto | null;
};

const GOAL_KINDS = [
  'EMERGENCY_FUND',
  'DEBT_PAYOFF',
  'TAX_RESERVE',
  'EQUIPMENT_PURCHASE',
  'MOVING_FUND',
  'VACATION',
  'BUSINESS_RESERVE',
  'RUNWAY',
  'CUSTOM',
] as const;

const AUTOMATION_MODES = [
  'MANUAL_ONLY',
  'FIXED_CONTRIBUTION',
  'PERCENT_OF_INCOME',
  'ROUND_UP',
  'SURPLUS_PERCENT',
  'PAYCHECK_SPLIT',
  'CONTRACTOR_PERCENT',
] as const;

export interface OperationalGoalsCenterProps {
  embedded?: boolean;
}

export default function OperationalGoalsCenter({ embedded = false }: OperationalGoalsCenterProps) {
  const [goals, setGoals] = useState<GoalListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [kind, setKind] = useState<string>(GOAL_KINDS[0]);
  const [mode, setMode] = useState<string>(AUTOMATION_MODES[0]);
  const [contrib, setContrib] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/goals/operational', { credentials: 'same-origin' });
      if (!res.ok) throw new Error('load failed');
      const data = (await res.json()) as { goals: GoalListItem[] };
      setGoals(data.goals);
    } catch {
      toast.error('Could not load operational goals');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const sorted = useMemo(
    () =>
      [...goals].sort((a, b) => {
        if (a.status === b.status) return a.priority - b.priority;
        if (a.status === 'ACTIVE') return -1;
        if (b.status === 'ACTIVE') return 1;
        return 0;
      }),
    [goals]
  );

  const createGoal = async () => {
    const t = Number(target);
    if (!name.trim() || !Number.isFinite(t) || t <= 0) {
      toast.error('Name and a positive target amount are required.');
      return;
    }
    setCreating(true);
    try {
      const res = await fetch('/api/goals/operational', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          goalKind: kind,
          targetAmount: t,
          automationMode: mode,
          createBucket: true,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(typeof j.error === 'string' ? j.error : 'Create failed');
      }
      toast.success('Goal created with linked bucket');
      setName('');
      setTarget('');
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Create failed');
    } finally {
      setCreating(false);
    }
  };

  const patchStatus = async (id: string, status: 'ACTIVE' | 'PAUSED') => {
    const res = await fetch(`/api/goals/operational/${id}`, {
      method: 'PATCH',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      toast.error('Could not update goal');
      return;
    }
    toast.success(status === 'PAUSED' ? 'Goal paused' : 'Goal resumed');
    await load();
  };

  const sendContribution = async (id: string) => {
    const raw = contrib[id] ?? '';
    const amt = Number(raw);
    if (!Number.isFinite(amt) || amt <= 0) {
      toast.error('Enter a positive contribution amount');
      return;
    }
    const res = await fetch(`/api/goals/operational/${id}/contribution`, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: amt }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      toast.error(typeof j.error === 'string' ? j.error : 'Contribution failed');
      return;
    }
    toast.success('Contribution recorded (SmartAllocation + bucket)');
    setContrib(c => ({ ...c, [id]: '' }));
    await load();
  };

  return (
    <div className="space-y-8">
      {!embedded ? (
        <header className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Operational goals</h1>
          <p className="max-w-3xl text-sm text-muted-foreground md:text-base">
            Goal execution tied to SmartBuckets and SmartAllocations — not passive progress bars. Contributions update
            real envelope balances; analysis reuses the same deterministic cash flow engine as Cash Flow.
          </p>
          <div className="flex flex-wrap gap-2 pt-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/cash-flow">Cash flow</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/money-control">Money control</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/operational-center">Operational center</Link>
            </Button>
          </div>
        </header>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Create operational goal</CardTitle>
          <CardDescription>
            Provisions a GOAL_FUND bucket (unless you wire an API with an existing bucket id). Automation modes are
            stored for future rule hooks; contributions are operational today.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="og-name">Name</Label>
            <Input
              id="og-name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. 6-month runway"
              className="bg-background"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="og-target">Target amount (USD)</Label>
            <Input
              id="og-target"
              inputMode="decimal"
              value={target}
              onChange={e => setTarget(e.target.value)}
              placeholder="10000"
              className="bg-background"
            />
          </div>
          <div className="space-y-2">
            <Label>Goal type</Label>
            <Select value={kind} onValueChange={setKind}>
              <SelectTrigger className="bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {GOAL_KINDS.map(k => (
                  <SelectItem key={k} value={k}>
                    {k.replace(/_/g, ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Automation mode (stored)</Label>
            <Select value={mode} onValueChange={setMode}>
              <SelectTrigger className="bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AUTOMATION_MODES.map(m => (
                  <SelectItem key={m} value={m}>
                    {m.replace(/_/g, ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2">
            <Button disabled={creating} onClick={() => void createGoal()}>
              {creating ? 'Creating…' : 'Create goal + bucket'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground">Active & paused goals</h2>
        {loading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : sorted.length === 0 ? (
          <p className="text-muted-foreground">No operational goals yet.</p>
        ) : (
          <ul className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
            {sorted.map(g => (
              <li key={g.id}>
                <Card className="h-full border-border">
                  <CardHeader>
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <CardTitle className="text-lg">{g.name}</CardTitle>
                        <CardDescription>
                          {g.goalKind.replace(/_/g, ' ')} · {g.status} · priority {g.priority}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        {g.status === 'ACTIVE' ? (
                          <Button variant="outline" size="sm" onClick={() => void patchStatus(g.id, 'PAUSED')}>
                            Pause
                          </Button>
                        ) : g.status === 'PAUSED' ? (
                          <Button variant="outline" size="sm" onClick={() => void patchStatus(g.id, 'ACTIVE')}>
                            Resume
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm">
                    <div className="rounded-lg border border-border bg-muted/30 p-3 dark:bg-muted/15">
                      <p className="font-medium text-foreground">Bucket progress (source of truth)</p>
                      <p className="text-muted-foreground">
                        <span className="font-mono text-foreground">${g.bucketBalance.toFixed(2)}</span> in{' '}
                        <span className="text-foreground">{g.bucketName}</span> toward{' '}
                        <span className="font-mono">${g.targetAmount.toFixed(2)}</span>
                        {g.targetDate ? ` by ${g.targetDate.slice(0, 10)}` : ''}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Linked SmartBucket id <span className="font-mono">{g.smartBucketId.slice(0, 10)}…</span>
                      </p>
                    </div>

                    {g.analysis ? (
                      <div className="space-y-2">
                        <p className="font-medium text-foreground">Deterministic analysis</p>
                        <ul className="list-inside list-disc text-muted-foreground">
                          {g.analysis.summaryExplain.map((line, i) => (
                            <li key={i}>{line}</li>
                          ))}
                        </ul>
                        {g.analysis.findings.length > 0 ? (
                          <div className="space-y-2 rounded-md border border-amber-500/40 bg-amber-500/5 p-3 dark:border-amber-400/30">
                            {g.analysis.findings.map(f => (
                              <div key={f.code}>
                                <p className="font-medium text-amber-900 dark:text-amber-100">{f.title}</p>
                                <p className="text-muted-foreground">{f.detail}</p>
                              </div>
                            ))}
                          </div>
                        ) : null}
                        {g.analysis.projectedCompletionDate ? (
                          <p className="text-xs text-muted-foreground">
                            At trailing 30d pace, projected completion around{' '}
                            <span className="font-mono">{g.analysis.projectedCompletionDate.slice(0, 10)}</span>.
                          </p>
                        ) : null}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">Analysis available for active goals only.</p>
                    )}

                    <div className="flex flex-wrap items-end gap-2 border-t border-border pt-3">
                      <div className="flex-1 space-y-1">
                        <Label htmlFor={`c-${g.id}`}>Contribute (USD)</Label>
                        <Input
                          id={`c-${g.id}`}
                          inputMode="decimal"
                          value={contrib[g.id] ?? ''}
                          onChange={e => setContrib(c => ({ ...c, [g.id]: e.target.value }))}
                          placeholder="250"
                          className="bg-background"
                        />
                      </div>
                      <Button
                        type="button"
                        disabled={g.status !== 'ACTIVE'}
                        onClick={() => void sendContribution(g.id)}
                      >
                        Record contribution
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
