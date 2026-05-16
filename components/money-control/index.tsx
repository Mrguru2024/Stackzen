'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { SubscriptionLevel } from '@prisma/client';
import type { AutomationRule, FinancialTransaction, SmartAllocation } from '@prisma/client';
import { hasAdvancedAutomationAccess } from '@/lib/financial-automation/premium';
import {
  BUDGET_CATEGORY_SLUGS,
  OPERATIONAL_TRANSACTION_CLASSES,
} from '@/lib/financial-automation/classification';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { toast } from 'sonner';
import { OperationalAlertCards } from '@/components/operational-center/OperationalAlertCards';
import type { OperationalAlertDto, OperationalAlertsResponseDto } from '@/lib/operational-notifications/types';
import BudgetBreakdownEditor from '@/components/money-control/BudgetBreakdownEditor';
import RuleTemplateGallery from '@/components/money-control/RuleTemplateGallery';
import { isBudgetMainAutomationConditions } from '@/lib/financial-automation/budget-main-rule';

const BUDGET_SPLIT_TEMPLATE_IDS = ['BUDGET_SPLIT_50_30_20', 'BUDGET_SPLIT_40_30_30', 'BUDGET_SPLIT_CUSTOM'] as const;

const MC_TAB_VALUES = new Set(['review', 'rules', 'alerts', 'buckets', 'activity']);

type LedgerRow = FinancialTransaction;

type ExecutionRow = {
  id: string;
  status: string;
  ruleId: string;
  startedAt: string;
  completedAt: string | null;
  resultSnapshot: unknown;
  inputSnapshot: unknown;
  rule: {
    id: string;
    name: string;
    type: string;
    triggerType: string;
    premiumRequired: boolean;
  };
};

type BucketRow = {
  id: string;
  name: string;
  type: string;
  targetAmount: number | null;
  currentAmount: number;
  allocations: SmartAllocation[];
};

type TimelineEvt = {
  id: string;
  type: string;
  source: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
};

type DetailResponse = {
  transaction: LedgerRow & { category?: unknown };
  allocations: Array<SmartAllocation & { bucket: { id: string; name: string; type: string; currentAmount: number } }>;
  executions: ExecutionRow[];
  explanation: {
    operationalClass: string;
    budgetCategorySlug: string;
    businessPersonal: string;
    trustNotes: string[];
  };
};

export default function MoneyControlCenter() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();

  const rawTab = searchParams.get('tab') ?? 'review';
  const highlightTxnId = searchParams.get('txnId') ?? '';
  const initialTab = MC_TAB_VALUES.has(rawTab) ? rawTab : 'review';

  const [tab, setTab] = useState(initialTab);

  const subscriptionLevel = (session?.user?.subscriptionLevel as SubscriptionLevel | undefined) ?? SubscriptionLevel.FREE;
  const automationPremium = hasAdvancedAutomationAccess(subscriptionLevel);

  const [loading, setLoading] = useState(true);
  const [ledger, setLedger] = useState<LedgerRow[]>([]);
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [operationalAlerts, setOperationalAlerts] = useState<OperationalAlertDto[]>([]);
  const [buckets, setBuckets] = useState<BucketRow[]>([]);
  const [events, setEvents] = useState<TimelineEvt[]>([]);

  const [detailOpen, setDetailOpen] = useState(Boolean(highlightTxnId));
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(highlightTxnId || null);
  const [detail, setDetail] = useState<DetailResponse | null>(null);

  const [draftCategoryName, setDraftCategoryName] = useState('');
  const [draftBudgetSlug, setDraftBudgetSlug] = useState<string>(BUDGET_CATEGORY_SLUGS[0]);
  const [draftOpClass, setDraftOpClass] = useState<string>(OPERATIONAL_TRANSACTION_CLASSES[0]);
  const [draftBiz, setDraftBiz] = useState<'BUSINESS' | 'PERSONAL'>('PERSONAL');
  const [draftRecurring, setDraftRecurring] = useState(false);

  useEffect(() => {
    const t = searchParams.get('tab');
    if (t && MC_TAB_VALUES.has(t)) setTab(t);
    const txn = searchParams.get('txnId');
    if (txn) setSelectedId(txn);
  }, [searchParams]);

  useEffect(() => {
    if (status !== 'authenticated') return;
    if (!MC_TAB_VALUES.has(tab)) return;
    const mcTab = tab as 'review' | 'rules' | 'alerts' | 'buckets' | 'activity';
    const ctrl = new AbortController();
    const handle = globalThis.setTimeout(() => {
      void fetch('/api/operational-center/checkpoint', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        signal: ctrl.signal,
        body: JSON.stringify({
          moneyControl: {
            tab: mcTab,
            financialTransactionId: mcTab === 'review' ? selectedId : null,
          },
        }),
      }).catch(() => {});
    }, 800);
    return () => {
      ctrl.abort();
      globalThis.clearTimeout(handle);
    };
  }, [tab, selectedId, status]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const types = [
        'TRANSACTION_CREATED',
        'TRANSACTION_CATEGORIZED',
        'AUTOMATION_RULE_EXECUTED',
        'AUTOMATION_RULE_FAILED',
        'AUTOMATION_NOTIFICATION_CREATED',
        'GUARDRAIL_WARNING',
        'GUARDRAIL_BREACH',
      ].join(',');
      const [txRes, rulesRes, opRes, buckRes, timeRes] = await Promise.all([
        fetch('/api/automation/transactions', { credentials: 'same-origin' }),
        fetch('/api/automation/rules', { credentials: 'same-origin' }),
        fetch('/api/operational-center/alerts?ensure=true', { credentials: 'same-origin' }),
        fetch('/api/automation/smart-buckets', { credentials: 'same-origin' }),
        fetch(`/api/financial-events/timeline?limit=35&types=${encodeURIComponent(types)}`, {
          credentials: 'same-origin',
        }),
      ]);
      if (txRes.ok) setLedger((await txRes.json()) as LedgerRow[]);
      if (rulesRes.ok) setRules((await rulesRes.json()) as AutomationRule[]);
      if (opRes.ok) {
        const opJson = (await opRes.json()) as OperationalAlertsResponseDto;
        setOperationalAlerts(opJson.alerts ?? []);
      }
      if (buckRes.ok) {
        const b = await buckRes.json();
        setBuckets(b.buckets as BucketRow[]);
      }
      if (timeRes.ok) {
        const t = await timeRes.json();
        setEvents(((t.events as TimelineEvt[]) ?? []) as TimelineEvt[]);
      }
    } catch {
      toast.error('Failed to refresh money control data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const loadDetail = async (id: string) => {
    setDetailLoading(true);
    setSelectedId(id);
    setDetailOpen(true);
    setTab('review');
    const p = new URLSearchParams(searchParams.toString());
    p.set('tab', 'review');
    p.set('txnId', id);
    const qs = p.toString();
    router.replace(`${pathname}?${qs}`, { scroll: false });
    try {
      const res = await fetch(`/api/automation/transactions/${id}`, { credentials: 'same-origin' });
      if (!res.ok) throw new Error('Failed to load');
      const data = (await res.json()) as DetailResponse;
      setDetail(data);
      setDraftCategoryName(data.transaction.categoryName ?? '');
      setDraftBudgetSlug(data.explanation.budgetCategorySlug);
      setDraftOpClass(data.explanation.operationalClass);
      setDraftBiz(data.explanation.businessPersonal as 'BUSINESS' | 'PERSONAL');
      setDraftRecurring(Boolean(data.transaction.isRecurringCandidate));
    } catch {
      toast.error('Could not load transaction detail');
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    if (highlightTxnId && ledger.some(t => t.id === highlightTxnId)) {
      void loadDetail(highlightTxnId);
    }
  }, [highlightTxnId, ledger]);

  const saveCorrections = async () => {
    if (!selectedId) return;
    try {
      const res = await fetch(`/api/automation/transactions/${selectedId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          categoryName: draftCategoryName || undefined,
          budgetCategorySlug: draftBudgetSlug,
          operationalClass: draftOpClass,
          businessPersonal: draftBiz,
          isRecurringCandidate: draftRecurring,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error((j as { error?: string }).error ?? 'Save failed');
      }
      toast.success('Transaction updated · automation replayed');
      await loadAll();
      await loadDetail(selectedId);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Save failed');
    }
  };

  const pauseRule = async (ruleId: string, enabled: boolean) => {
    try {
      const res = await fetch(`/api/automation/rules/${ruleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ enabled }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((j as { error?: string }).error ?? 'Update failed');
      toast.success(enabled ? 'Rule enabled' : 'Rule paused');
      await loadAll();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Rule update failed');
    }
  };

  const setPriority = async (ruleId: string, priority: number) => {
    if (!automationPremium) return;
    try {
      const res = await fetch(`/api/automation/rules/${ruleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ priority }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((j as { error?: string }).error ?? 'Priority update failed');
      toast.success('Priority updated');
      await loadAll();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Priority update failed');
    }
  };

  const attentionAlertCount = useMemo(
    () => operationalAlerts.filter(a => a.inAttentionQueue).length,
    [operationalAlerts]
  );

  const visibleRules = useMemo(
    () => rules.filter(r => !isBudgetMainAutomationConditions(r.conditions)),
    [rules]
  );

  const handleTabChange = (next: string) => {
    if (!MC_TAB_VALUES.has(next)) return;
    setTab(next);
    const p = new URLSearchParams(searchParams.toString());
    p.set('tab', next);
    if (next !== 'review') p.delete('txnId');
    const qs = p.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  if (status === 'loading') {
    return <div className="p-8 text-muted-foreground">Checking session...</div>;
  }
  if (status !== 'authenticated') {
    return <div className="p-8 text-destructive">Sign in required.</div>;
  }

  return (
    <div className="space-y-6 py-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Money control</h1>
          <p className="mt-2 max-w-3xl text-muted-foreground">
            Review money in and out of your accounts, fix categories your automations depend on, adjust rules, and clear
            alerts. When income rules run, StackZen moves amounts into your automation and goal buckets so those balances
            match your plan—not only what your bank shows. Rule templates include purchase round-ups, optional set-asides
            when you spend in certain categories, fixed saves on a weekly or monthly schedule, and paycheck or tax
            buckets. Moving money between buckets here does not send cash between your linked checking and savings at the
            bank; that only happens when you use a supported transfer flow or your bank moves the funds.
          </p>
        </div>
        <Button variant="outline" size="default" asChild className="h-11 w-full shrink-0 touch-manipulation sm:h-10 sm:w-auto">
          <Link href="/cash-flow">Cash flow outlook</Link>
        </Button>
      </header>

      <Tabs value={tab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="inline-flex h-auto w-full max-w-full flex-nowrap justify-start gap-1 overflow-x-auto overscroll-x-contain rounded-md bg-muted p-1 pb-2 [-ms-overflow-style:none] [scrollbar-width:none] sm:flex-wrap sm:overflow-x-visible sm:pb-1 [&::-webkit-scrollbar]:hidden">
          <TabsTrigger
            value="review"
            className="shrink-0 snap-start px-3 py-2.5 text-sm touch-manipulation sm:py-2"
          >
            Review
          </TabsTrigger>
          <TabsTrigger
            value="rules"
            className="shrink-0 snap-start px-3 py-2.5 text-sm touch-manipulation sm:py-2"
          >
            Rules
          </TabsTrigger>
          <TabsTrigger
            value="alerts"
            className="shrink-0 snap-start px-3 py-2.5 text-sm touch-manipulation sm:py-2"
          >
            Alerts ({attentionAlertCount})
          </TabsTrigger>
          <TabsTrigger
            value="buckets"
            className="shrink-0 snap-start px-3 py-2.5 text-sm touch-manipulation sm:py-2"
          >
            Buckets
          </TabsTrigger>
          <TabsTrigger
            value="activity"
            className="shrink-0 snap-start px-3 py-2.5 text-sm touch-manipulation sm:py-2"
          >
            Activity
          </TabsTrigger>
        </TabsList>

        <TabsContent value="review" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>FinancialTransaction ledger</CardTitle>
                <CardDescription>Open a row to correct category, classification, recurring flag, or business use.</CardDescription>
              </div>
              <Button variant="outline" size="sm" disabled={loading} onClick={() => void loadAll()}>
                Refresh
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-muted-foreground">Loading transactions...</p>
              ) : ledger.length === 0 ? (
                <p className="text-muted-foreground">
                  No ledger rows yet. Connect a bank sync, add a manual automation transaction, record an expense, or post an
                  invoice payment.
                </p>
              ) : (
                <div className="overflow-x-auto rounded-md border">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-muted/60">
                      <tr>
                        <th className="p-3">Date</th>
                        <th className="p-3">Description</th>
                        <th className="p-3">Direction</th>
                        <th className="p-3 text-right">Amount</th>
                        <th className="p-3">Category</th>
                        <th className="p-3"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {ledger.map(row => (
                        <tr key={row.id} className="border-t hover:bg-muted/40">
                          <td className="p-3 whitespace-nowrap">{new Date(row.postedAt).toLocaleDateString()}</td>
                          <td className="p-3 max-w-xs truncate">{row.description}</td>
                          <td className="p-3">
                            <Badge variant={row.direction === 'INFLOW' ? 'secondary' : 'outline'}>{row.direction}</Badge>
                          </td>
                          <td className="p-3 text-right font-medium">${Math.abs(row.amount).toFixed(2)}</td>
                          <td className="p-3 truncate">{row.categoryName ?? '—'}</td>
                          <td className="p-3">
                            <Button size="sm" variant="outline" onClick={() => void loadDetail(row.id)}>
                              Correct
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rules" className="space-y-6">
          <BudgetBreakdownEditor onChange={loadAll} />
          <RuleTemplateGallery onRuleCreated={loadAll} excludeTemplateIds={[...BUDGET_SPLIT_TEMPLATE_IDS]} />
          <Card>
            <CardHeader>
              <CardTitle>Additional automation rules</CardTitle>
              <CardDescription>
                Savings boosts, tax reserves, and guardrails you add from templates appear here. The budget breakdown card
                above owns your primary income split; it is not duplicated in this list.
                {!automationPremium && ' Free plan: one rule can be enabled at a time, and priority editing requires Pro.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {visibleRules.length === 0 ? (
                <p className="text-muted-foreground">
                  No extra automation rules yet. Use a template above (savings, taxes, or guardrails), or keep only the
                  budget breakdown card.
                </p>
              ) : (
                visibleRules.map(rule => (
                  <div key={rule.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
                    <div>
                      <p className="font-medium">{rule.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Type {rule.type} · Trigger {rule.triggerType} · Priority {rule.priority}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {automationPremium && (
                        <div className="flex items-center gap-2">
                          <Label className="text-xs">Priority</Label>
                          <Input
                            type="number"
                            className="w-20"
                            defaultValue={rule.priority}
                            key={rule.id + rule.priority}
                            onBlur={e => {
                              const next = Number(e.target.value);
                              if (Number.isFinite(next)) void setPriority(rule.id, next);
                            }}
                          />
                        </div>
                      )}
                      <label className="flex items-center gap-2 text-sm">
                        Enabled
                        <Switch checked={rule.enabled} onCheckedChange={checked => void pauseRule(rule.id, checked)} />
                      </label>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts">
          <Card>
            <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4">
              <div>
                <CardTitle>Operational alerts</CardTitle>
                <CardDescription>
                  Same enriched queue as the Operational Center: automation, guardrails, income detection, overdue invoices,
                  and jobs awaiting deposits or balances.
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/operational-center">Expand in Operational Center</Link>
              </Button>
            </CardHeader>
            <CardContent>
              <OperationalAlertCards
                items={operationalAlerts.filter(a => a.inAttentionQueue)}
                onMutate={loadAll}
                compactTrust
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="buckets">
          <Card>
            <CardHeader>
              <CardTitle>Buckets & allocation lines</CardTitle>
              <CardDescription>Automation envelopes (<code>AUTOMATION_ENVELOPE</code>) increment from rule executions.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {buckets.length === 0 ? (
                <p className="text-muted-foreground">
                  No smart buckets defined. Once allocation rules execute, envelopes appear automatically.
                </p>
              ) : (
                buckets.map(b => (
                  <div key={b.id} className="rounded-lg border p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="font-semibold capitalize">{b.name}</p>
                        <p className="text-xs text-muted-foreground">{b.type}</p>
                      </div>
                      <div className="text-right font-mono text-sm">
                        <div>Balance ${Number(b.currentAmount).toFixed(2)}</div>
                        {typeof b.targetAmount === 'number' ? (
                          <div className="text-xs text-muted-foreground">
                            Target ${b.targetAmount.toFixed(2)}
                          </div>
                        ) : null}
                      </div>
                    </div>
                    <ul className="mt-2 space-y-1 border-t pt-2 text-xs text-muted-foreground">
                      {(b.allocations ?? []).slice(0, 6).map(a => (
                        <li key={a.id} className="flex justify-between gap-2">
                          <span>${a.amount.toFixed(2)}</span>
                          <span className="truncate">{a.description ?? a.source}</span>
                          {a.financialTransactionId ? (
                            <Button variant="link" className="h-auto p-0 text-xs" onClick={() => void loadDetail(a.financialTransactionId!)}>
                              Ledger
                            </Button>
                          ) : (
                            <span />
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>FinancialEvent stream</CardTitle>
              <CardDescription>Automation, guardrails, and transaction audit events filtered for this workspace.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {events.length === 0 ? (
                <p className="text-muted-foreground">Could not load or no automation-related events.</p>
              ) : (
                events.map(ev => (
                  <div key={ev.id} className="rounded-md border p-2 text-sm">
                    <div className="flex flex-wrap justify-between gap-2">
                      <span className="font-medium">{ev.type}</span>
                      <span className="text-xs text-muted-foreground">{new Date(ev.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Source: {ev.source}</p>
                  </div>
                ))
              )}
              <Button asChild variant="link" size="sm" className="px-0">
                <Link href="/financial-timeline">Open full timeline</Link>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Sheet
        open={detailOpen}
        onOpenChange={open => {
          setDetailOpen(open);
          if (!open) {
            const p = new URLSearchParams(searchParams.toString());
            p.delete('txnId');
            const qs = p.toString();
            router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
          }
        }}
      >
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Correct transaction</SheetTitle>
            <SheetDescription>Leverages PATCH /api/automation/transactions/:id · replays downstream automation safely.</SheetDescription>
          </SheetHeader>
          {detailLoading ? (
            <p className="py-8 text-muted-foreground">Loading detail...</p>
          ) : detail ? (
            <>
              <div className="mt-4 space-y-2 rounded-md bg-muted p-3 text-xs">
                <div className="font-medium">Trust notes</div>
                {detail.explanation.trustNotes.map((note, idx) => (
                  <div key={`${note}-${idx}`}>• {note}</div>
                ))}
              </div>
              <div className="mt-4 grid gap-3">
                <div>
                  <Label>Category label</Label>
                  <Input value={draftCategoryName} onChange={e => setDraftCategoryName(e.target.value)} />
                </div>
                <div>
                  <Label>Budget taxonomy</Label>
                  <Select value={draftBudgetSlug} onValueChange={setDraftBudgetSlug}>
                    <SelectTrigger>
                      <SelectValue placeholder="Slug" />
                    </SelectTrigger>
                    <SelectContent>
                      {[...BUDGET_CATEGORY_SLUGS].map(s => (
                        <SelectItem key={s} value={s}>
                          {s.replace(/_/g, ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Operational class</Label>
                  <Select value={draftOpClass} onValueChange={setDraftOpClass}>
                    <SelectTrigger>
                      <SelectValue placeholder="Class" />
                    </SelectTrigger>
                    <SelectContent>
                      {[...OPERATIONAL_TRANSACTION_CLASSES].map(o => (
                        <SelectItem key={o} value={o}>
                          {o.replace(/_/g, ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Business vs personal</Label>
                  <Select value={draftBiz} onValueChange={v => setDraftBiz(v as 'BUSINESS' | 'PERSONAL')}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PERSONAL">Personal</SelectItem>
                      <SelectItem value="BUSINESS">Business</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <Switch checked={draftRecurring} onCheckedChange={setDraftRecurring} />
                  Signal recurring candidate
                </label>
              </div>
              <div className="mt-4 space-y-2">
                <Label>Linked allocations ({detail.allocations.length})</Label>
                {detail.allocations.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No allocations posted for this ledger row yet.</p>
                ) : (
                  <ul className="space-y-1 text-xs">
                    {detail.allocations.map(a => (
                      <li key={a.id}>
                        → {a.bucket.name}: ${a.amount.toFixed(2)} ({a.source})
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="mt-4 space-y-2">
                <Label>Recent executions ({detail.executions.length})</Label>
                {detail.executions.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No automation executions recorded referencing this txn.</p>
                ) : (
                  <ul className="space-y-2 text-xs">
                    {detail.executions.map(ex => (
                      <li key={ex.id} className="rounded border p-2">
                        <strong>{ex.rule.name}</strong> ({ex.rule.type}) — {ex.status}
                        <div className="text-muted-foreground">
                          Completed {ex.completedAt ? new Date(ex.completedAt).toLocaleString() : '—'}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          ) : (
            <p className="text-muted-foreground">No detail loaded.</p>
          )}
          <SheetFooter className="mt-6">
            <Button onClick={() => void saveCorrections()} disabled={!selectedId || detailLoading}>
              Save corrections & replay automation
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
