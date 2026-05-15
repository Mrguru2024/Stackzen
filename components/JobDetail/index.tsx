'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, ClipboardList, Download, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import {
  downloadJobsJson,
  jobsToCsv,
  triggerDownload,
  type JobListExportInput,
} from '@/lib/jobs/download-export';
import { humanizeEnum } from '@/lib/jobs/humanize';

interface QuoteBrief {
  id: string;
  title: string;
  status: string;
}

interface InvoiceBrief {
  id: string;
  number: string;
  amount: number;
  status: string;
}

interface ExpenseBrief {
  id: string;
  description: string;
  amount: number;
  category: string;
}

/** API shape from GET /api/jobs/[jobId] */
interface JobDetailApi {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  workType?: string | null;
  paymentType?: string | null;
  sourceLabel?: string | null;
  incomeProfileType?: string | null;
  estimatedAmount?: number | null;
  depositRequired?: boolean;
  depositType?: string | null;
  depositFixedAmount?: number | null;
  depositPercentage?: number | null;
  depositPaid?: number;
  depositWaived?: boolean;
  depositStatus?: string | null;
  remainingBalance?: number | null;
  jobRevenue?: number;
  jobExpenses?: number;
  estimatedProfit?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  client?: { name?: string | null; email?: string | null } | null;
  service?: { title?: string | null; name?: string | null } | null;
  quotes?: QuoteBrief[];
  invoices?: InvoiceBrief[];
  expenses?: ExpenseBrief[];
}

function toExportRow(job: JobDetailApi): JobListExportInput {
  return {
    id: job.id,
    title: job.title,
    status: job.status,
    workType: job.workType,
    paymentType: job.paymentType,
    sourceLabel: job.sourceLabel,
    incomeProfileType: job.incomeProfileType,
    estimatedAmount: job.estimatedAmount,
    jobRevenue: job.jobRevenue,
    jobExpenses: job.jobExpenses,
    remainingBalance: job.remainingBalance,
    estimatedProfit: job.estimatedProfit,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
    client: job.client,
    service: job.service,
    quotes: job.quotes,
    invoices: job.invoices,
  };
}

export interface JobDetailProps {
  className?: string;
}

interface DepositPolicyForm {
  depositRequired: boolean;
  depositType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  depositPercentage: number;
  depositFixedAmount: number;
  depositWaived: boolean;
}

export default function JobDetail({ className }: Readonly<JobDetailProps>) {
  const params = useParams<{ jobId: string }>();
  const jobId = params?.jobId;
  const [job, setJob] = useState<JobDetailApi | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [depositForm, setDepositForm] = useState<DepositPolicyForm>({
    depositRequired: false,
    depositType: 'PERCENTAGE',
    depositPercentage: 10,
    depositFixedAmount: 0,
    depositWaived: false,
  });
  const [policySaving, setPolicySaving] = useState(false);
  const [policyError, setPolicyError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!jobId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/jobs/${jobId}`, { credentials: 'same-origin' });
      if (res.status === 404) {
        setJob(null);
        setError('Job not found');
        return;
      }
      if (!res.ok) throw new Error('Could not load job');
      const data = (await res.json()) as JobDetailApi;
      setJob(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load job');
      setJob(null);
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!job) return;
    const typeFromJob: 'PERCENTAGE' | 'FIXED_AMOUNT' =
      job.depositType === 'FIXED_AMOUNT' ? 'FIXED_AMOUNT' : 'PERCENTAGE';
    setDepositForm({
      depositRequired: Boolean(job.depositRequired),
      depositType: typeFromJob,
      depositPercentage: job.depositPercentage ?? 10,
      depositFixedAmount: job.depositFixedAmount ?? 0,
      depositWaived: Boolean(job.depositWaived),
    });
    setPolicyError(null);
  }, [job]);

  const saveDepositPolicy = async () => {
    if (!jobId) return;
    setPolicySaving(true);
    setPolicyError(null);
    try {
      const body: Record<string, unknown> = {};
      if (!depositForm.depositRequired) {
        body.depositRequired = false;
      } else {
        body.depositRequired = true;
        body.depositWaived = depositForm.depositWaived;
        if (depositForm.depositType === 'PERCENTAGE') {
          body.depositType = 'PERCENTAGE';
          body.depositPercentage = Number(depositForm.depositPercentage);
        } else {
          body.depositType = 'FIXED_AMOUNT';
          body.depositFixedAmount = Number(depositForm.depositFixedAmount);
        }
      }

      const res = await fetch(`/api/jobs/${jobId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error ?? 'Could not save deposit policy');
      }

      await load();
    } catch (e) {
      setPolicyError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setPolicySaving(false);
    }
  };

  const handleCsv = () => {
    if (!job) return;
    const row = toExportRow(job);
    const csv = jobsToCsv([row]);
    triggerDownload(`stackzen-job-${job.id}.csv`, csv, 'text/csv;charset=utf-8');
  };

  const handleJson = () => {
    if (!job) return;
    downloadJobsJson(`stackzen-job-${job.id}.json`, job);
  };

  if (!jobId) {
    return null;
  }

  return (
    <div className={cn('pb-10', className)}>
      <header className="sticky top-0 z-20 -mx-4 border-b border-border/80 bg-background/95 px-4 pb-4 pt-2 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <Link
              href="/jobs"
              className={cn(
                buttonVariants({ variant: 'ghost', size: 'icon' }),
                'mt-0.5 min-h-11 min-w-11 shrink-0'
              )}
              aria-label="Back to jobs"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary dark:bg-primary/20">
                  <ClipboardList className="h-5 w-5" aria-hidden />
                </div>
                <h1 className="line-clamp-2 text-xl font-bold tracking-tight sm:text-2xl">
                  {loading ? 'Loading…' : (job?.title ?? 'Job')}
                </h1>
              </div>
              {job ? (
                <p className="mt-1 text-sm text-muted-foreground">
                  {job.client?.name ?? 'Client'} · Updated {formatDate(job.updatedAt)}
                </p>
              ) : null}
            </div>
          </div>

          {job ? (
            <div className="flex flex-wrap gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="button" variant="outline" className="min-h-11">
                    <Download className="mr-2 h-4 w-4" aria-hidden />
                    Download
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={handleCsv} className="cursor-pointer">
                    This job (CSV)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleJson} className="cursor-pointer">
                    Full detail (JSON)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                type="button"
                variant="secondary"
                className="min-h-11"
                onClick={() => void load()}
              >
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Refresh
              </Button>
            </div>
          ) : null}
        </div>
      </header>

      {loading && !job ? (
        <div className="flex flex-col items-center justify-center gap-3 py-24 text-muted-foreground">
          <Loader2 className="h-10 w-10 animate-spin" aria-hidden />
          <p>Loading job…</p>
        </div>
      ) : null}

      {error && !job ? (
        <Card className="mt-8 border-destructive/40">
          <CardHeader>
            <CardTitle className="text-destructive">{error}</CardTitle>
            <Link
              href="/jobs"
              className={cn(
                buttonVariants({ variant: 'outline' }),
                'mt-2 inline-flex w-fit min-h-11'
              )}
            >
              Back to jobs
            </Link>
          </CardHeader>
        </Card>
      ) : null}

      {job ? (
        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex flex-wrap items-center gap-2">
                <Badge>{humanizeEnum(job.status)}</Badge>
                {job.workType ? (
                  <Badge variant="outline">{humanizeEnum(job.workType)}</Badge>
                ) : null}
                {job.paymentType ? (
                  <Badge variant="secondary">{humanizeEnum(job.paymentType)}</Badge>
                ) : null}
              </div>
              <CardTitle className="text-lg">Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              {job.description ? (
                <p className="leading-relaxed text-muted-foreground">{job.description}</p>
              ) : null}

              <p className="text-xs text-muted-foreground">
                Revenue and profit use paid invoices and job-linked expenses via{' '}
                <code className="rounded bg-muted px-1 py-0.5 text-[0.7rem]">
                  recomputeJobRevenue
                </code>{' '}
                on each load.
              </p>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Metric label="Revenue (paid)" value={formatCurrency(job.jobRevenue ?? 0)} />
                <Metric label="Job expenses" value={formatCurrency(job.jobExpenses ?? 0)} />
                <Metric label="Est. profit" value={formatCurrency(job.estimatedProfit ?? 0)} />
                <Metric label="Remaining" value={formatCurrency(job.remainingBalance ?? 0)} />
              </div>

              <Link
                href={`/financial-timeline?jobId=${job.id}`}
                className={cn(
                  buttonVariants({ variant: 'outline', size: 'sm' }),
                  'inline-flex min-h-9 w-fit'
                )}
              >
                View financial activity timeline
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Client & schedule</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <dl className="space-y-2">
                <div>
                  <dt className="text-xs text-muted-foreground">Client</dt>
                  <dd className="font-medium">{job.client?.name ?? '—'}</dd>
                </div>
                {job.client?.email ? (
                  <div>
                    <dt className="text-xs text-muted-foreground">Email</dt>
                    <dd className="break-all font-medium">{job.client.email}</dd>
                  </div>
                ) : null}
                <div>
                  <dt className="text-xs text-muted-foreground">Service</dt>
                  <dd className="font-medium">{job.service?.title ?? job.service?.name ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Est. contract</dt>
                  <dd className="font-medium tabular-nums">
                    {job.estimatedAmount != null ? formatCurrency(job.estimatedAmount) : '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Created</dt>
                  <dd>{formatDate(job.createdAt)}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle className="text-lg">Deposit policy</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {!job.depositRequired ? (
                <p className="text-muted-foreground">No deposit required — the job can proceed without a deposit hold.</p>
              ) : (
                <>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">{humanizeEnum(job.depositStatus ?? 'UNKNOWN')}</Badge>
                    {job.depositWaived ? <Badge variant="secondary">Waived</Badge> : null}
                  </div>
                  <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <dt className="text-xs text-muted-foreground">Type</dt>
                      <dd className="font-medium">{humanizeEnum(job.depositType ?? 'NONE')}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">Collected (paid deposits)</dt>
                      <dd className="font-medium tabular-nums">{formatCurrency(job.depositPaid ?? 0)}</dd>
                    </div>
                    {job.depositType === 'PERCENTAGE' ? (
                      <div>
                        <dt className="text-xs text-muted-foreground">Percentage</dt>
                        <dd className="font-medium">
                          {job.depositPercentage != null ? `${job.depositPercentage}%` : '—'}
                        </dd>
                      </div>
                    ) : null}
                    {job.depositType === 'FIXED_AMOUNT' ? (
                      <div>
                        <dt className="text-xs text-muted-foreground">Fixed amount</dt>
                        <dd className="font-medium tabular-nums">
                          {job.depositFixedAmount != null ? formatCurrency(job.depositFixedAmount) : '—'}
                        </dd>
                      </div>
                    ) : null}
                  </dl>
                  <p className="text-xs text-muted-foreground">
                    Starting work (In progress) requires deposit <strong>Paid</strong> or a recorded{' '}
                    <strong>waiver</strong> when deposit is required. Final invoice balances still subtract paid
                    deposits.
                  </p>
                </>
              )}

              <div className="space-y-4 border-t border-border pt-4">
                <h3 className="text-sm font-semibold text-foreground">Edit deposit policy</h3>
                <div className="flex flex-row items-center justify-between gap-4 rounded-lg border border-border px-3 py-3">
                  <div className="space-y-0.5">
                    <Label htmlFor="deposit-required">Require deposit before In progress</Label>
                    <p className="text-xs text-muted-foreground">
                      When on, status cannot move to In progress until the deposit is paid or waived.
                    </p>
                  </div>
                  <Switch
                    id="deposit-required"
                    checked={depositForm.depositRequired}
                    onCheckedChange={checked =>
                      setDepositForm(f => ({ ...f, depositRequired: Boolean(checked) }))
                    }
                    disabled={policySaving}
                  />
                </div>

                {depositForm.depositRequired ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="deposit-type">Deposit calculation</Label>
                      <Select
                        value={depositForm.depositType}
                        onValueChange={v =>
                          setDepositForm(f => ({
                            ...f,
                            depositType: v === 'FIXED_AMOUNT' ? 'FIXED_AMOUNT' : 'PERCENTAGE',
                          }))
                        }
                        disabled={policySaving}
                      >
                        <SelectTrigger id="deposit-type" className="max-w-xs">
                          <SelectValue placeholder="Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PERCENTAGE">Percentage of estimate</SelectItem>
                          <SelectItem value="FIXED_AMOUNT">Fixed amount</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {depositForm.depositType === 'PERCENTAGE' ? (
                      <div className="space-y-2">
                        <Label htmlFor="deposit-pct">Deposit percentage</Label>
                        <Input
                          id="deposit-pct"
                          type="number"
                          min={0}
                          max={100}
                          step={0.5}
                          className="max-w-[12rem]"
                          value={depositForm.depositPercentage}
                          onChange={e =>
                            setDepositForm(f => ({
                              ...f,
                              depositPercentage: Number(e.target.value),
                            }))
                          }
                          disabled={policySaving}
                        />
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Label htmlFor="deposit-fixed">Fixed deposit amount</Label>
                        <Input
                          id="deposit-fixed"
                          type="number"
                          min={0}
                          step={0.01}
                          className="max-w-[12rem]"
                          value={depositForm.depositFixedAmount}
                          onChange={e =>
                            setDepositForm(f => ({
                              ...f,
                              depositFixedAmount: Number(e.target.value),
                            }))
                          }
                          disabled={policySaving}
                        />
                      </div>
                    )}

                    <div className="flex flex-row items-center justify-between gap-4 rounded-lg border border-dashed border-border px-3 py-3">
                      <div className="space-y-0.5">
                        <Label htmlFor="deposit-waive">Waive deposit requirement</Label>
                        <p className="text-xs text-muted-foreground">
                          Allows In progress without collecting a deposit (internal approval).
                        </p>
                      </div>
                      <Switch
                        id="deposit-waive"
                        checked={depositForm.depositWaived}
                        onCheckedChange={checked =>
                          setDepositForm(f => ({ ...f, depositWaived: Boolean(checked) }))
                        }
                        disabled={policySaving}
                      />
                    </div>
                  </>
                ) : null}

                {policyError ? (
                  <p className="text-sm text-destructive" role="alert">
                    {policyError}
                  </p>
                ) : null}

                <Button
                  type="button"
                  className="min-h-11"
                  onClick={() => void saveDepositPolicy()}
                  disabled={policySaving || loading}
                >
                  {policySaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                      Saving…
                    </>
                  ) : (
                    'Save deposit policy'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle className="text-lg">Linked records</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <MiniStat label="Quotes" value={job.quotes?.length ?? 0} />
                <MiniStat label="Invoices" value={job.invoices?.length ?? 0} />
                <MiniStat label="Expenses" value={job.expenses?.length ?? 0} />
              </div>

              {job.quotes && job.quotes.length > 0 ? (
                <div>
                  <h3 className="mb-2 text-sm font-semibold">Quotes</h3>
                  <ul className="divide-y rounded-md border text-sm">
                    {job.quotes.map(q => (
                      <li
                        key={q.id}
                        className="flex flex-wrap items-center justify-between gap-2 px-3 py-2"
                      >
                        <span className="font-medium">{q.title}</span>
                        <span className="text-muted-foreground">{humanizeEnum(q.status)}</span>
                        <Link
                          href={`/quotes/edit/${q.id}`}
                          className={cn(
                            buttonVariants({ variant: 'link', size: 'sm' }),
                            'h-auto p-0'
                          )}
                        >
                          Open
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {job.invoices && job.invoices.length > 0 ? (
                <div>
                  <h3 className="mb-2 text-sm font-semibold">Invoices</h3>
                  <ul className="divide-y rounded-md border text-sm">
                    {job.invoices.map(inv => (
                      <li
                        key={inv.id}
                        className="flex flex-wrap items-center justify-between gap-2 px-3 py-2"
                      >
                        <span className="font-mono text-xs">{inv.number}</span>
                        <span className="tabular-nums">{formatCurrency(inv.amount)}</span>
                        <span className="text-muted-foreground">{inv.status}</span>
                        <Link
                          href={`/invoices/${inv.id}`}
                          className={cn(
                            buttonVariants({ variant: 'link', size: 'sm' }),
                            'h-auto p-0'
                          )}
                        >
                          Open
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {job.expenses && job.expenses.length > 0 ? (
                <div>
                  <h3 className="mb-2 text-sm font-semibold">Expenses</h3>
                  <ul className="divide-y rounded-md border text-sm">
                    {job.expenses.map(ex => (
                      <li
                        key={ex.id}
                        className="flex flex-wrap items-center justify-between gap-2 px-3 py-2"
                      >
                        <span className="max-w-[50%] truncate">{ex.description}</span>
                        <span className="text-muted-foreground">{ex.category}</span>
                        <span className="tabular-nums">{formatCurrency(ex.amount)}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-2 text-xs text-muted-foreground">
                    <Link href="/expenses" className="text-primary underline">
                      Open expenses
                    </Link>{' '}
                    to add or edit entries.
                  </p>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/50 px-3 py-2 dark:bg-muted/20">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-lg font-semibold tabular-nums">{value}</span>
    </div>
  );
}
