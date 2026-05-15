'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useBank } from '@/lib/hooks/use-bank';
import { usePlaidBankLink } from '@/lib/hooks/use-plaid-bank-link';
import { PAYOUT_CHANNEL_OPTIONS } from '@/lib/income/payout-channels';
import { cn, formatCurrency } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Icons } from '@/components/ui/icons';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import type { AutomationRule } from '@prisma/client';
import type {
  CashFlowForecastResponseDto,
  DetectedSeriesDto,
} from '@/lib/cashflow/types';
import type { IncomeIntelligenceSnapshotDto } from '@/lib/income-intelligence/types';

interface SourcesResponse {
  plaidConfigured: boolean;
  bankConnections: Array<{
    id: string;
    institutionName: string | null;
    status: string;
    lastSuccessfulSyncAt: string | null;
  }>;
  payoutChannelIds: string[];
  customLabels: string[];
}

interface IncomeSummary {
  totalIncome: number;
  averageIncome: number;
  incomeByCategory: Array<{ category: string; amount: number }>;
  totalBookings: number;
  breakdown: {
    servicesBookings: number;
    manualLedger: number;
    bankDepositsSynced: number;
  };
}

interface LedgerEntry {
  id: string;
  amount: number;
  date: string;
  source: string;
  notes: string | null;
  createdAt: string;
}

interface AllocationActionShape {
  bucket: string;
  percent: number;
}

async function parseJson<T>(res: Response): Promise<T> {
  const data = (await res.json()) as unknown;
  if (!res.ok) {
    throw new Error(
      (data as { error?: string }).error ?? `Request failed (${res.status})`,
    );
  }
  return data as T;
}

function readAllocationActions(actions: unknown): AllocationActionShape[] {
  if (!Array.isArray(actions)) return [];
  return actions
    .map(raw => {
      if (!raw || typeof raw !== 'object') return null;
      const o = raw as Record<string, unknown>;
      const bucket = typeof o.bucket === 'string' ? o.bucket.trim() : '';
      const percentRaw = typeof o.percent === 'number' ? o.percent : Number(o.percent);
      if (!bucket || !Number.isFinite(percentRaw)) return null;
      return { bucket, percent: percentRaw };
    })
    .filter((a): a is AllocationActionShape => a !== null);
}

const NEXT_30D_WINDOW = 30 as const;

const CATEGORY_PALETTE = [
  'bg-emerald-500',
  'bg-sky-500',
  'bg-violet-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-teal-500',
  'bg-indigo-500',
  'bg-fuchsia-500',
];

export default function IncomeSourcesHub() {
  const queryClient = useQueryClient();
  const bank = useBank();
  const { open, ready, isLoadingLinkToken, error: plaidError } = usePlaidBankLink({
    linkToken: bank.linkToken,
    isLoadingLinkToken: bank.isLoadingLinkToken,
    exchangeToken: bank.exchangeToken,
  });

  const sourcesQuery = useQuery({
    queryKey: ['income-sources'],
    queryFn: async () => parseJson<SourcesResponse>(await fetch('/api/income/sources')),
  });

  const summaryQuery = useQuery({
    queryKey: ['income-summary'],
    queryFn: async () => parseJson<IncomeSummary>(await fetch('/api/income/summary')),
  });

  const ledgerQuery = useQuery({
    queryKey: ['income-ledger'],
    queryFn: async () => parseJson<LedgerEntry[]>(await fetch('/api/income/ledger')),
  });

  const forecastQuery = useQuery({
    queryKey: ['cashflow-forecast', 'income-hub'],
    queryFn: async () =>
      parseJson<CashFlowForecastResponseDto>(
        await fetch('/api/cashflow/forecast?includeDetails=false', {
          credentials: 'same-origin',
        }),
      ),
    staleTime: 60_000,
  });

  const rulesQuery = useQuery({
    queryKey: ['automation-rules', 'income-hub'],
    queryFn: async () =>
      parseJson<AutomationRule[]>(
        await fetch('/api/automation/rules', { credentials: 'same-origin' }),
      ),
  });

  const intelQuery = useQuery({
    queryKey: ['income-intel', 'income-hub'],
    queryFn: async () =>
      parseJson<IncomeIntelligenceSnapshotDto>(
        await fetch('/api/operational-center/income-intelligence?ensure=false', {
          credentials: 'same-origin',
        }),
      ),
    staleTime: 60_000,
  });

  const channelLabelById = useMemo(() => {
    const m = new Map<string, string>();
    for (const c of PAYOUT_CHANNEL_OPTIONS) m.set(c.id, c.label);
    return m;
  }, []);

  const saveChannelsMutation = useMutation({
    mutationFn: async (payoutChannelIds: string[]) => {
      const snapshot = queryClient.getQueryData<SourcesResponse>(['income-sources']);
      const res = await fetch('/api/income/sources', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payoutChannelIds,
          customLabels: snapshot?.customLabels ?? [],
        }),
      });
      return parseJson<{ payoutChannelIds: string[] }>(res);
    },
    onMutate: async nextIds => {
      await queryClient.cancelQueries({ queryKey: ['income-sources'] });
      const previous = queryClient.getQueryData<SourcesResponse>(['income-sources']);
      if (previous) {
        queryClient.setQueryData<SourcesResponse>(['income-sources'], {
          ...previous,
          payoutChannelIds: nextIds,
        });
      }
      return { previous };
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(['income-sources'], ctx.previous);
      }
      toast.error(err instanceof Error ? err.message : 'Could not save payout sources');
    },
    onSuccess: () => {
      toast.success('Payout sources updated');
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['income-sources'] });
    },
  });

  const toggleChannel = (id: string, checked: boolean) => {
    const current = sourcesQuery.data?.payoutChannelIds ?? [];
    const next = checked
      ? Array.from(new Set([...current, id]))
      : current.filter(x => x !== id);
    saveChannelsMutation.mutate(next);
  };

  const [amount, setAmount] = useState('');
  const [incomeDate, setIncomeDate] = useState(() =>
    new Date().toISOString().split('T')[0],
  );
  const [sourceKey, setSourceKey] = useState<string>(
    PAYOUT_CHANNEL_OPTIONS[0]?.id ?? 'other',
  );
  const [customSource, setCustomSource] = useState('');
  const [notes, setNotes] = useState('');

  const ledgerMutation = useMutation({
    mutationFn: async () => {
      const source =
        sourceKey === 'other'
          ? customSource.trim() || 'Other'
          : (channelLabelById.get(sourceKey) ?? sourceKey);
      const res = await fetch('/api/income/ledger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Number(amount),
          date: incomeDate,
          source,
          notes: notes.trim() || null,
        }),
      });
      return parseJson<LedgerEntry>(res);
    },
    onSuccess: entry => {
      setAmount('');
      setNotes('');
      toast.success(`Logged ${formatCurrency(entry.amount)} from ${entry.source}`);
      void queryClient.invalidateQueries({ queryKey: ['income-ledger'] });
      void queryClient.invalidateQueries({ queryKey: ['income-summary'] });
      void queryClient.invalidateQueries({ queryKey: ['incomes'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const summary = summaryQuery.data;
  const forecast = forecastQuery.data;
  const intel = intelQuery.data;
  const rules = rulesQuery.data ?? [];

  const expectedNext30 = useMemo(() => {
    if (!forecast) return null;
    const w = forecast.windows.find(x => x.windowDays === NEXT_30D_WINDOW);
    return w?.expectedIncomeTotal ?? null;
  }, [forecast]);

  const sourcesConnectedCount =
    (sourcesQuery.data?.bankConnections.filter(c => c.status === 'ACTIVE').length ?? 0) +
    (sourcesQuery.data?.payoutChannelIds.length ?? 0);

  const allocationRules = useMemo(
    () =>
      rules
        .filter(r => r.type === 'ALLOCATION' && r.enabled)
        .map(r => ({ rule: r, actions: readAllocationActions(r.actions) }))
        .filter(x => x.actions.length > 0),
    [rules],
  );

  const totalIntelSignals =
    (intel?.delayedIncome.length ?? 0) +
    (intel?.irregularPayouts.length ?? 0) +
    (intel?.decliningPayouts.length ?? 0) +
    ((intel?.concentration.herfindahlIndex ?? 0) >= 0.48 ? 1 : 0);

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6">
      <Header
        loadError={
          sourcesQuery.error instanceof Error ? sourcesQuery.error.message : null
        }
        plaidError={plaidError ?? null}
      />

      <KpiGrid
        loading={summaryQuery.isLoading || forecastQuery.isLoading || sourcesQuery.isLoading}
        totalIncome={summary?.totalIncome ?? 0}
        averageIncome={summary?.averageIncome ?? 0}
        expectedNext30={expectedNext30}
        sourcesConnected={sourcesConnectedCount}
        intelSignalCount={totalIntelSignals}
      />

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="connections">Connections</TabsTrigger>
          <TabsTrigger value="log">Log income</TabsTrigger>
          <TabsTrigger value="flows">Flows &amp; signals</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <SourceBreakdown
            loading={summaryQuery.isLoading}
            summary={summary ?? null}
          />
          <RecentActivity
            loading={ledgerQuery.isLoading}
            entries={ledgerQuery.data ?? []}
          />
        </TabsContent>

        <TabsContent value="connections" className="space-y-4">
          <BankConnections
            data={sourcesQuery.data ?? null}
            loading={sourcesQuery.isLoading}
            isLoadingLinkToken={isLoadingLinkToken}
            ready={ready}
            onConnect={() => open()}
          />
          <PayoutChannels
            selected={sourcesQuery.data?.payoutChannelIds ?? []}
            disabled={saveChannelsMutation.isPending}
            onToggle={toggleChannel}
          />
        </TabsContent>

        <TabsContent value="log" className="space-y-4">
          <LogIncomeCard
            amount={amount}
            onAmountChange={setAmount}
            incomeDate={incomeDate}
            onDateChange={setIncomeDate}
            sourceKey={sourceKey}
            onSourceKeyChange={setSourceKey}
            customSource={customSource}
            onCustomSourceChange={setCustomSource}
            notes={notes}
            onNotesChange={setNotes}
            submitting={ledgerMutation.isPending}
            errorMessage={
              ledgerMutation.error instanceof Error ? ledgerMutation.error.message : null
            }
            onSubmit={() => ledgerMutation.mutate()}
            allocationPreview={allocationRules[0] ?? null}
          />
        </TabsContent>

        <TabsContent value="flows" className="space-y-4">
          <ExpectedIncomeCard
            loading={forecastQuery.isLoading}
            series={forecast?.recurringIncome ?? []}
          />
          <AutomationFlowsCard
            loading={rulesQuery.isLoading}
            rules={allocationRules}
          />
          <SignalsCard loading={intelQuery.isLoading} intel={intel ?? null} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface HeaderProps {
  loadError: string | null;
  plaidError: string | null;
}

function Header({ loadError, plaidError }: HeaderProps) {
  return (
    <header className="space-y-3">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Income sources
        </h1>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
          Connect the channels you actually get paid through, log what your bank doesn&apos;t
          capture, and watch the money move into automations, buckets, and the cash-flow
          forecast in real time.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button asChild size="sm" variant="outline">
          <Link href="/cash-flow">
            <Icons.trendingUp className="mr-1.5 h-4 w-4" aria-hidden />
            Cash flow
          </Link>
        </Button>
        <Button asChild size="sm" variant="outline">
          <Link href="/money-control?tab=rules">Automations</Link>
        </Button>
        <Button asChild size="sm" variant="outline">
          <Link href="/money-control?tab=buckets">Buckets</Link>
        </Button>
        <Button asChild size="sm" variant="outline">
          <Link href="/income">Income hub</Link>
        </Button>
      </div>
      {(loadError || plaidError) && (
        <Alert variant="destructive">
          <AlertTitle>Something went wrong</AlertTitle>
          <AlertDescription>
            {[loadError, plaidError].filter(Boolean).join(' · ')}
          </AlertDescription>
        </Alert>
      )}
    </header>
  );
}

interface KpiGridProps {
  loading: boolean;
  totalIncome: number;
  averageIncome: number;
  expectedNext30: number | null;
  sourcesConnected: number;
  intelSignalCount: number;
}

function KpiGrid({
  loading,
  totalIncome,
  averageIncome,
  expectedNext30,
  sourcesConnected,
  intelSignalCount,
}: KpiGridProps) {
  if (loading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <KpiCard
        label="Income this month"
        value={formatCurrency(totalIncome)}
        sublabel={`Avg per event ${formatCurrency(averageIncome)}`}
        icon={<Icons.dollarSign className="h-4 w-4" aria-hidden />}
        accent="emerald"
      />
      <KpiCard
        label="Expected (next 30 days)"
        value={expectedNext30 !== null ? formatCurrency(expectedNext30) : '—'}
        sublabel={
          expectedNext30 !== null
            ? 'Modeled from detected payout cadence'
            : 'Need more deposit history'
        }
        icon={<Icons.trendingUp className="h-4 w-4" aria-hidden />}
        accent="sky"
        href="/cash-flow"
      />
      <KpiCard
        label="Sources connected"
        value={String(sourcesConnected)}
        sublabel="Active banks + payout apps"
        icon={<Icons.bank className="h-4 w-4" aria-hidden />}
        accent="violet"
      />
      <KpiCard
        label="Signals to review"
        value={String(intelSignalCount)}
        sublabel={
          intelSignalCount > 0
            ? 'Delayed / irregular / concentration'
            : 'No outstanding income signals'
        }
        icon={<Icons.warning className="h-4 w-4" aria-hidden />}
        accent={intelSignalCount > 0 ? 'amber' : 'muted'}
      />
    </div>
  );
}

interface KpiCardProps {
  label: string;
  value: string;
  sublabel: string;
  icon: React.ReactNode;
  accent: 'emerald' | 'sky' | 'violet' | 'amber' | 'muted';
  href?: string;
}

const ACCENT_BG: Record<KpiCardProps['accent'], string> = {
  emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  sky: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
  violet: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
  amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  muted: 'bg-muted text-muted-foreground',
};

function KpiCard({ label, value, sublabel, icon, accent, href }: KpiCardProps) {
  const inner = (
    <Card className="h-full transition-colors hover:border-primary/40">
      <CardContent className="flex items-start gap-3 p-4">
        <div className={cn('rounded-md p-2', ACCENT_BG[accent])}>{icon}</div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium text-muted-foreground">{label}</p>
          <p className="mt-0.5 truncate text-xl font-bold text-foreground sm:text-2xl">
            {value}
          </p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">{sublabel}</p>
        </div>
      </CardContent>
    </Card>
  );

  if (href) {
    return (
      <Link href={href} className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg">
        {inner}
      </Link>
    );
  }
  return inner;
}

interface SourceBreakdownProps {
  loading: boolean;
  summary: IncomeSummary | null;
}

function SourceBreakdown({ loading, summary }: SourceBreakdownProps) {
  const sorted = useMemo(() => {
    if (!summary) return [];
    return [...summary.incomeByCategory].sort((a, b) => b.amount - a.amount);
  }, [summary]);

  const total = summary?.totalIncome ?? 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Where this month came from</CardTitle>
        <CardDescription>
          Combines completed bookings, bank deposits classified as income, and your manual
          ledger entries. Same numbers shown in the income summary.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <>
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
          </>
        ) : sorted.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No income recorded this month yet. Connect a bank, complete a booking, or log a
            payment to fill the picture.
          </p>
        ) : (
          <ul className="space-y-2.5">
            {sorted.map((row, i) => {
              const pct = total > 0 ? (row.amount / total) * 100 : 0;
              return (
                <li key={row.category} className="space-y-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-sm font-medium text-foreground">
                      {row.category}
                    </span>
                    <span className="shrink-0 font-mono text-sm">
                      {formatCurrency(row.amount)}{' '}
                      <span className="text-xs text-muted-foreground">
                        ({pct.toFixed(0)}%)
                      </span>
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all',
                        CATEGORY_PALETTE[i % CATEGORY_PALETTE.length],
                      )}
                      style={{ width: `${Math.max(2, pct)}%` }}
                      aria-hidden
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        {summary && (
          <div className="grid gap-2 border-t border-border pt-3 text-xs text-muted-foreground sm:grid-cols-3">
            <div className="flex items-center justify-between gap-2">
              <span>Bookings</span>
              <span className="font-mono text-foreground">
                {formatCurrency(summary.breakdown.servicesBookings)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span>Bank deposits</span>
              <span className="font-mono text-foreground">
                {formatCurrency(summary.breakdown.bankDepositsSynced)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span>Manual ledger</span>
              <span className="font-mono text-foreground">
                {formatCurrency(summary.breakdown.manualLedger)}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface RecentActivityProps {
  loading: boolean;
  entries: LedgerEntry[];
}

function RecentActivity({ loading, entries }: RecentActivityProps) {
  const visible = entries.slice(0, 6);
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg">Recent manual entries</CardTitle>
          <CardDescription>
            Latest rows from your income ledger. Bank-synced deposits live in{' '}
            <Link
              href="/money-control?tab=review"
              className="text-primary underline-offset-4 hover:underline"
            >
              Money Control
            </Link>
            .
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
          </div>
        ) : visible.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No manual entries yet. Use the &quot;Log income&quot; tab to add one.
          </p>
        ) : (
          <ul className="divide-y divide-border rounded-md border border-border">
            {visible.map(row => (
              <li
                key={row.id}
                className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">{row.source}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(row.date).toLocaleDateString()}
                    {row.notes ? ` · ${row.notes}` : ''}
                  </p>
                </div>
                <Badge variant="secondary" className="shrink-0 font-mono">
                  {formatCurrency(row.amount)}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

interface BankConnectionsProps {
  data: SourcesResponse | null;
  loading: boolean;
  isLoadingLinkToken: boolean;
  ready: boolean;
  onConnect: () => void;
}

function BankConnections({
  data,
  loading,
  isLoadingLinkToken,
  ready,
  onConnect,
}: BankConnectionsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Icons.bank className="h-5 w-5" aria-hidden />
          Bank accounts
        </CardTitle>
        <CardDescription>
          Secure Plaid connection. Deposits flagged as income flow into your monthly totals,
          the cash-flow forecast, and any allocation automations.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {data && !data.plaidConfigured && (
          <Alert>
            <AlertTitle>Plaid not configured</AlertTitle>
            <AlertDescription>
              Add <code className="text-xs">PLAID_CLIENT_ID</code>,{' '}
              <code className="text-xs">PLAID_SECRET</code>, and{' '}
              <code className="text-xs">PLAID_ENV</code> to your environment to enable live
              bank linking.
            </AlertDescription>
          </Alert>
        )}
        <Button
          type="button"
          onClick={onConnect}
          disabled={!data?.plaidConfigured || !ready || isLoadingLinkToken}
          className="w-full sm:w-auto"
        >
          {isLoadingLinkToken ? (
            <>
              <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
              Preparing link…
            </>
          ) : (
            <>
              <Icons.bank className="mr-2 h-4 w-4" />
              Connect bank account
            </>
          )}
        </Button>
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">Linked institutions</p>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : !data?.bankConnections?.length ? (
            <p className="text-sm text-muted-foreground">No bank connections yet.</p>
          ) : (
            <ul className="space-y-2">
              {data.bankConnections.map(c => (
                <li
                  key={c.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-sm"
                >
                  <div>
                    <p className="font-medium text-foreground">
                      {c.institutionName ?? 'Bank'}
                    </p>
                    {c.lastSuccessfulSyncAt && (
                      <p className="text-xs text-muted-foreground">
                        Last sync {new Date(c.lastSuccessfulSyncAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                  <Badge
                    variant={c.status === 'ACTIVE' ? 'success' : 'secondary'}
                    className="shrink-0"
                  >
                    {c.status}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface PayoutChannelsProps {
  selected: string[];
  disabled: boolean;
  onToggle: (id: string, checked: boolean) => void;
}

function PayoutChannels({ selected, disabled, onToggle }: PayoutChannelsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Payout &amp; transfer apps</CardTitle>
        <CardDescription>
          Mark the apps you actually receive money through. Choices auto-save and power the
          quick-pick source list when you log income manually.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-2 sm:grid-cols-2">
          {PAYOUT_CHANNEL_OPTIONS.map(ch => {
            const checked = selected.includes(ch.id);
            return (
              <label
                key={ch.id}
                className={cn(
                  'flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors',
                  checked
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:bg-muted/40',
                  disabled && 'cursor-wait opacity-70',
                )}
              >
                <Checkbox
                  checked={checked}
                  disabled={disabled}
                  onCheckedChange={v => onToggle(ch.id, v === true)}
                  className="mt-0.5"
                  aria-label={ch.label}
                />
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-foreground">
                    {ch.label}
                  </span>
                  {ch.description ? (
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {ch.description}
                    </span>
                  ) : null}
                </span>
              </label>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

interface LogIncomeCardProps {
  amount: string;
  onAmountChange: (v: string) => void;
  incomeDate: string;
  onDateChange: (v: string) => void;
  sourceKey: string;
  onSourceKeyChange: (v: string) => void;
  customSource: string;
  onCustomSourceChange: (v: string) => void;
  notes: string;
  onNotesChange: (v: string) => void;
  submitting: boolean;
  errorMessage: string | null;
  onSubmit: () => void;
  allocationPreview: { rule: AutomationRule; actions: AllocationActionShape[] } | null;
}

function LogIncomeCard(props: LogIncomeCardProps) {
  const {
    amount,
    onAmountChange,
    incomeDate,
    onDateChange,
    sourceKey,
    onSourceKeyChange,
    customSource,
    onCustomSourceChange,
    notes,
    onNotesChange,
    submitting,
    errorMessage,
    onSubmit,
    allocationPreview,
  } = props;

  const numericAmount = Number(amount);
  const isValidAmount = Number.isFinite(numericAmount) && numericAmount > 0;
  const isCustom = sourceKey === 'other';
  const canSubmit =
    !submitting && isValidAmount && (!isCustom || customSource.trim().length > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Log income manually</CardTitle>
        <CardDescription>
          Use this when a payment doesn&apos;t hit a linked bank — cash, off-app gigs, or
          quick adjustments. Entries land on your income ledger and roll into the monthly
          totals.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {errorMessage && (
          <Alert variant="destructive">
            <AlertTitle>Couldn&apos;t save</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="inc-amount">Amount (USD)</Label>
            <Input
              id="inc-amount"
              type="number"
              inputMode="decimal"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={e => onAmountChange(e.target.value)}
              className="bg-background"
              placeholder="0.00"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="inc-date">Date received</Label>
            <Input
              id="inc-date"
              type="date"
              value={incomeDate}
              onChange={e => onDateChange(e.target.value)}
              className="bg-background"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="inc-source">Source</Label>
            <Select value={sourceKey} onValueChange={onSourceKeyChange}>
              <SelectTrigger id="inc-source" className="bg-background">
                <SelectValue placeholder="Source" />
              </SelectTrigger>
              <SelectContent>
                {PAYOUT_CHANNEL_OPTIONS.map(ch => (
                  <SelectItem key={ch.id} value={ch.id}>
                    {ch.label}
                  </SelectItem>
                ))}
                <SelectItem value="other">Custom…</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {isCustom && (
            <div className="space-y-2">
              <Label htmlFor="inc-custom-src">Custom source name</Label>
              <Input
                id="inc-custom-src"
                value={customSource}
                onChange={e => onCustomSourceChange(e.target.value)}
                placeholder="e.g. Tutoring — Mrs. Lee"
                className="bg-background"
              />
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="inc-notes">Notes (optional)</Label>
          <Textarea
            id="inc-notes"
            value={notes}
            onChange={e => onNotesChange(e.target.value)}
            rows={2}
            className="resize-none bg-background"
            placeholder="What was this for? Helpful for category clean-up later."
          />
        </div>

        <LiveAllocationPreview
          amount={isValidAmount ? numericAmount : 0}
          preview={allocationPreview}
        />

        <Button type="button" onClick={onSubmit} disabled={!canSubmit} className="w-full sm:w-auto">
          {submitting ? (
            <>
              <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
              Saving…
            </>
          ) : (
            <>
              <Icons.plus className="mr-2 h-4 w-4" />
              Add to income ledger
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

interface LiveAllocationPreviewProps {
  amount: number;
  preview: { rule: AutomationRule; actions: AllocationActionShape[] } | null;
}

function LiveAllocationPreview({ amount, preview }: LiveAllocationPreviewProps) {
  if (!preview) {
    return (
      <div className="rounded-lg border border-dashed border-border p-3 text-xs text-muted-foreground">
        No active allocation automation. Add one in{' '}
        <Link
          href="/money-control?tab=rules"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          Money Control → Rules
        </Link>{' '}
        to auto-split future income across smart buckets.
      </div>
    );
  }

  const slices = preview.actions.map(a => ({
    ...a,
    dollars: amount > 0 ? (amount * a.percent) / 100 : 0,
  }));

  return (
    <div className="rounded-lg border border-border bg-muted/30 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-xs font-medium text-foreground">
          If this matched your bank rule
        </div>
        <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
          {preview.rule.name}
        </Badge>
      </div>
      <ul className="mt-2 space-y-1.5">
        {slices.map(s => (
          <li key={s.bucket} className="flex items-center gap-2 text-xs">
            <span className="w-12 shrink-0 text-right font-mono text-muted-foreground">
              {s.percent.toFixed(0)}%
            </span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-background">
              <div
                className="h-full rounded-full bg-primary/70"
                style={{ width: `${Math.min(100, s.percent)}%` }}
                aria-hidden
              />
            </div>
            <span className="w-16 shrink-0 truncate text-left font-medium text-foreground">
              {s.bucket}
            </span>
            <span className="w-20 shrink-0 text-right font-mono text-foreground">
              {amount > 0 ? formatCurrency(s.dollars) : '—'}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-[11px] text-muted-foreground">
        Manual entries don&apos;t execute rules — values shown for reference. Bank-synced
        deposits run automations automatically.
      </p>
    </div>
  );
}

interface ExpectedIncomeCardProps {
  loading: boolean;
  series: DetectedSeriesDto[];
}

function ExpectedIncomeCard({ loading, series }: ExpectedIncomeCardProps) {
  const sorted = useMemo(() => {
    return [...series]
      .filter(s => s.direction === 'INFLOW')
      .sort((a, b) => {
        const aT = a.nextExpectedDate ? Date.parse(a.nextExpectedDate) : Number.MAX_SAFE_INTEGER;
        const bT = b.nextExpectedDate ? Date.parse(b.nextExpectedDate) : Number.MAX_SAFE_INTEGER;
        return aT - bT;
      })
      .slice(0, 8);
  }, [series]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Icons.calendar className="h-5 w-5" aria-hidden />
          Expected income (detected)
        </CardTitle>
        <CardDescription>
          Cadence patterns the cash-flow engine learned from past deposits. Use this to plan
          allocations and reserve targets.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
          </div>
        ) : sorted.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No recurring inflow patterns detected yet. Connect a bank or wait for a few
            cycles of deposits.
          </p>
        ) : (
          <ul className="divide-y divide-border rounded-md border border-border">
            {sorted.map(s => (
              <li
                key={s.key}
                className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">{s.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {s.cadence} · confidence {s.confidence.toFixed(2)} ·{' '}
                    {s.nextExpectedDate
                      ? `next ~${new Date(s.nextExpectedDate).toLocaleDateString()}`
                      : 'no projected date'}
                  </p>
                </div>
                <Badge variant="secondary" className="shrink-0 font-mono">
                  ~{formatCurrency(s.medianAmount)}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

interface AutomationFlowsCardProps {
  loading: boolean;
  rules: Array<{ rule: AutomationRule; actions: AllocationActionShape[] }>;
}

function AutomationFlowsCard({ loading, rules }: AutomationFlowsCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Icons.trendingUp className="h-5 w-5" aria-hidden />
            Active income automations
          </CardTitle>
          <CardDescription>
            Allocation rules that fire when a paycheck or deposit lands. They write{' '}
            <code className="rounded bg-muted px-1 text-xs">SmartAllocation</code> lines to
            your buckets.
          </CardDescription>
        </div>
        <Button asChild size="sm" variant="outline">
          <Link href="/money-control?tab=rules">Manage</Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <>
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </>
        ) : rules.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
            No active allocation automations. Once you create one in Money Control, incoming
            deposits will split into smart buckets automatically.
          </div>
        ) : (
          rules.map(({ rule, actions }) => (
            <div
              key={rule.id}
              className="rounded-lg border border-border bg-card/60 p-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">{rule.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Trigger {rule.triggerType} · Priority {rule.priority}
                  </p>
                </div>
                <Badge variant={rule.enabled ? 'success' : 'secondary'}>
                  {rule.enabled ? 'Enabled' : 'Paused'}
                </Badge>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                <Badge variant="outline" className="shrink-0">
                  <Icons.dollarSign className="mr-1 h-3 w-3" aria-hidden />
                  Income event
                </Badge>
                <Icons.arrowRight className="h-4 w-4 text-muted-foreground" aria-hidden />
                <Badge variant="outline" className="shrink-0">
                  {rule.name}
                </Badge>
                <Icons.arrowRight className="h-4 w-4 text-muted-foreground" aria-hidden />
                <div className="flex flex-wrap gap-1.5">
                  {actions.map(a => (
                    <Badge
                      key={a.bucket}
                      variant="secondary"
                      className="font-mono text-[11px]"
                    >
                      {a.bucket} · {a.percent.toFixed(0)}%
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

interface SignalsCardProps {
  loading: boolean;
  intel: IncomeIntelligenceSnapshotDto | null;
}

function SignalsCard({ loading, intel }: SignalsCardProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Income health signals</CardTitle>
          <CardDescription>Analyzing your inflow patterns…</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!intel) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Income health signals</CardTitle>
          <CardDescription>
            Snapshot unavailable. Try again from{' '}
            <Link
              href="/operational-center"
              className="text-primary underline-offset-4 hover:underline"
            >
              Operational Center
            </Link>
            .
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const topShare = intel.concentration.topSources[0]?.shareOfTotal ?? 0;
  const concentrationHigh = intel.concentration.herfindahlIndex >= 0.48 || topShare >= 0.58;
  const hasAny =
    intel.delayedIncome.length > 0 ||
    intel.irregularPayouts.length > 0 ||
    intel.decliningPayouts.length > 0 ||
    concentrationHigh;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Icons.piggyBank className="h-5 w-5" aria-hidden />
          Income health signals
        </CardTitle>
        <CardDescription>
          Deterministic patterns from your transaction ledger — same engine that powers the
          Operational Center.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {!hasAny && (
          <p className="text-muted-foreground">
            No outstanding signals. Cadence looks stable, no overdue deposits, no
            concentration risk.
          </p>
        )}

        {intel.delayedIncome.length > 0 && (
          <SignalRow
            tone="destructive"
            title="Delayed expected deposits"
            items={intel.delayedIncome.slice(0, 3).map(d => ({
              key: d.seriesKey,
              label: `${d.label} · ${d.daysPastExpected}d past expected (${d.cadence})`,
              href: d.sampleTransactionIds[0]
                ? `/money-control?tab=review&txnId=${d.sampleTransactionIds[0]}`
                : undefined,
            }))}
          />
        )}

        {concentrationHigh && (
          <SignalRow
            tone="warning"
            title="High income concentration"
            items={[
              {
                key: 'concentration',
                label: `Top source ${(topShare * 100).toFixed(0)}% of last 90d inflows. Consider diversifying or padding your reserve.`,
                href: '/cash-flow',
              },
            ]}
          />
        )}

        {intel.irregularPayouts.length > 0 && (
          <SignalRow
            tone="info"
            title="Irregular payout intervals"
            items={intel.irregularPayouts.slice(0, 3).map(p => ({
              key: p.series.key,
              label: `${p.series.label} · every ~${p.series.medianIntervalDays.toFixed(0)}d (confidence ${p.series.confidence.toFixed(2)})`,
            }))}
          />
        )}

        {intel.decliningPayouts.length > 0 && (
          <SignalRow
            tone="warning"
            title="Declining recent payouts"
            items={intel.decliningPayouts.slice(0, 3).map(d => ({
              key: d.seriesKey,
              label: `${d.label}: recent median ${formatCurrency(d.recentMedianUsd)} vs prior ${formatCurrency(d.priorMedianUsd)}`,
            }))}
          />
        )}
      </CardContent>
    </Card>
  );
}

type SignalTone = 'destructive' | 'warning' | 'info';

interface SignalRowItem {
  key: string;
  label: string;
  href?: string;
}

const TONE_STYLES: Record<SignalTone, string> = {
  destructive: 'border-destructive/30 bg-destructive/5',
  warning: 'border-amber-500/30 bg-amber-500/5',
  info: 'border-border bg-muted/30',
};

function SignalRow({
  tone,
  title,
  items,
}: {
  tone: SignalTone;
  title: string;
  items: SignalRowItem[];
}) {
  return (
    <section className={cn('rounded-lg border p-3', TONE_STYLES[tone])}>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <ul className="mt-1.5 space-y-1 text-xs text-muted-foreground">
        {items.map(it => (
          <li key={it.key}>
            {it.href ? (
              <Link
                href={it.href}
                className="text-foreground underline-offset-4 hover:underline"
              >
                {it.label}
              </Link>
            ) : (
              <span className="text-foreground">{it.label}</span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
