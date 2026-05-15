'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ClipboardList, Download, Loader2, Search, SlidersHorizontal } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
import { cn, formatCurrency } from '@/lib/utils';
import {
  downloadJobsJson,
  jobsToCsv,
  triggerDownload,
  type JobListExportInput,
} from '@/lib/jobs/download-export';
import { humanizeEnum } from '@/lib/jobs/humanize';

const JOB_STATUSES = [
  'NEW',
  'QUOTED',
  'APPROVED',
  'DEPOSIT_PENDING',
  'IN_PROGRESS',
  'AWAITING_PAYMENT',
  'PAID',
  'COMPLETED',
  'CLOSED',
] as const;

const JOB_WORK_TYPES = [
  'CONTRACTOR_JOB',
  'FREELANCE_PROJECT',
  'GIG_SHIFT',
  'PAYCHECK_CYCLE',
  'SERVICE_BOOKING',
  'SIDE_HUSTLE_TASK',
  'OTHER',
] as const;

export interface JobsHubProps {
  className?: string;
}

export default function JobsHub({ className }: Readonly<JobsHubProps>) {
  const [jobs, setJobs] = useState<JobListExportInput[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [workTypeFilter, setWorkTypeFilter] = useState<string>('all');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/jobs', { credentials: 'same-origin' });
      if (!res.ok) {
        throw new Error('Could not load jobs');
      }
      const data = (await res.json()) as JobListExportInput[];
      setJobs(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load jobs');
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return jobs.filter(job => {
      if (statusFilter !== 'all' && job.status !== statusFilter) return false;
      if (workTypeFilter !== 'all') {
        if (workTypeFilter === '__none__' && job.workType != null) return false;
        if (workTypeFilter !== '__none__' && job.workType !== workTypeFilter) return false;
      }
      if (!q) return true;
      const clientName = job.client?.name?.toLowerCase() ?? '';
      const title = job.title.toLowerCase();
      const source = job.sourceLabel?.toLowerCase() ?? '';
      return title.includes(q) || clientName.includes(q) || source.includes(q);
    });
  }, [jobs, search, statusFilter, workTypeFilter]);

  const exportFilenameBase = useMemo(() => {
    const d = new Date();
    const stamp = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return `stackzen-jobs-${stamp}`;
  }, []);

  const handleDownloadCsv = () => {
    const csv = jobsToCsv(filtered);
    triggerDownload(`${exportFilenameBase}.csv`, csv, 'text/csv;charset=utf-8');
  };

  const handleDownloadJson = () => {
    downloadJobsJson(`${exportFilenameBase}.json`, filtered);
  };

  return (
    <div className={cn('flex min-h-[calc(100vh-6rem)] flex-col pb-8', className)}>
      {/* App-style sticky toolbar */}
      <header className="sticky top-0 z-20 -mx-4 border-b border-border/80 bg-background/95 px-4 pb-4 pt-2 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary dark:bg-primary/20">
              <ClipboardList className="h-6 w-6" aria-hidden />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Jobs</h1>
              <p className="text-sm text-muted-foreground">
                Pipeline, normalization fields, and exports — works on phone and desktop.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-11 min-w-[44px] touch-manipulation"
                  disabled={loading || filtered.length === 0}
                >
                  <Download className="mr-2 h-4 w-4" aria-hidden />
                  Download
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem
                  onClick={handleDownloadCsv}
                  disabled={filtered.length === 0}
                  className="cursor-pointer"
                >
                  Export CSV (filtered)
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleDownloadJson}
                  disabled={filtered.length === 0}
                  className="cursor-pointer"
                >
                  Export JSON (filtered)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              type="button"
              variant="secondary"
              className="min-h-11 touch-manipulation"
              onClick={() => void load()}
              disabled={loading}
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden /> : null}
              Refresh
            </Button>
          </div>
        </div>

        {/* Filters — responsive stack */}
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <div className="relative min-w-[min(100%,220px)] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search title, client, or source…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="min-h-11 pl-9"
              aria-label="Search jobs"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <SlidersHorizontal className="h-4 w-4 shrink-0" aria-hidden />
              <span className="sr-only sm:not-sr-only sm:inline">Filters</span>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger
                className="min-h-11 w-[min(100vw-2rem,200px)] sm:w-[200px]"
                aria-label="Filter by status"
              >
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {JOB_STATUSES.map(s => (
                  <SelectItem key={s} value={s}>
                    {humanizeEnum(s)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={workTypeFilter} onValueChange={setWorkTypeFilter}>
              <SelectTrigger
                className="min-h-11 w-[min(100vw-2rem,220px)] sm:w-[220px]"
                aria-label="Filter by work type"
              >
                <SelectValue placeholder="Work type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All work types</SelectItem>
                <SelectItem value="__none__">Unspecified</SelectItem>
                {JOB_WORK_TYPES.map(w => (
                  <SelectItem key={w} value={w}>
                    {humanizeEnum(w)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </header>

      {error && (
        <div
          role="alert"
          className="mt-6 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive dark:bg-destructive/20"
        >
          {error}
        </div>
      )}

      {loading && jobs.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 py-24 text-muted-foreground">
          <Loader2 className="h-10 w-10 animate-spin" aria-hidden />
          <p>Loading your jobs…</p>
        </div>
      ) : null}

      {!loading && filtered.length === 0 ? (
        <Card className="mt-8 border-dashed">
          <CardHeader>
            <CardTitle className="text-lg">No jobs match</CardTitle>
            <p className="text-sm text-muted-foreground">
              Adjust filters or create jobs via your API and quotes flow. Export uses the filtered
              list shown here.
            </p>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button asChild variant="default" className="min-h-11">
              <Link href="/clients">Go to clients</Link>
            </Button>
            <Button asChild variant="outline" className="min-h-11">
              <Link href="/quotes">Quotes</Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {/* Responsive grid: 1 col phone, 2 tablet, 3 desktop */}
      <ul className="mt-6 grid list-none grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map(job => (
          <li key={job.id}>
            <Link
              href={`/jobs/${job.id}`}
              className="block h-full rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Card className="h-full transition-colors hover:bg-accent/30 dark:hover:bg-accent/10">
                <CardHeader className="space-y-2 pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="line-clamp-2 text-base font-semibold leading-snug">
                      {job.title}
                    </CardTitle>
                    <Badge variant="secondary" className="shrink-0 whitespace-nowrap text-xs">
                      {humanizeEnum(job.status)}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {job.client?.name ?? 'Unknown client'}
                  </p>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted/50 px-3 py-2 dark:bg-muted/20">
                    <div>
                      <p className="text-xs text-muted-foreground">Revenue</p>
                      <p className="font-medium tabular-nums">
                        {formatCurrency(job.jobRevenue ?? 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Expenses</p>
                      <p className="font-medium tabular-nums">
                        {formatCurrency(job.jobExpenses ?? 0)}
                      </p>
                    </div>
                  </div>
                  <dl className="grid gap-1 text-xs text-muted-foreground">
                    {job.workType ? (
                      <div className="flex justify-between gap-2">
                        <dt>Work type</dt>
                        <dd className="text-right font-medium text-foreground">
                          {humanizeEnum(job.workType)}
                        </dd>
                      </div>
                    ) : null}
                    {job.paymentType ? (
                      <div className="flex justify-between gap-2">
                        <dt>Payment</dt>
                        <dd className="text-right font-medium text-foreground">
                          {humanizeEnum(job.paymentType)}
                        </dd>
                      </div>
                    ) : null}
                    {job.sourceLabel ? (
                      <div className="flex justify-between gap-2">
                        <dt>Source</dt>
                        <dd className="truncate text-right font-medium text-foreground">
                          {job.sourceLabel}
                        </dd>
                      </div>
                    ) : null}
                  </dl>
                </CardContent>
              </Card>
            </Link>
          </li>
        ))}
      </ul>

      {!loading && filtered.length > 0 ? (
        <p className="mt-8 text-center text-sm text-muted-foreground">
          Showing {filtered.length} of {jobs.length} jobs · exports use the filtered list
        </p>
      ) : null}
    </div>
  );
}
