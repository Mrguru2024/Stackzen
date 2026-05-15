'use client';

import { useCallback, useEffect, useMemo, useState, type ReactElement } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

type FinancialEvent = {
  id: string;
  type: string;
  source: string;
  amount: number | null;
  currency: string;
  metadata: Record<string, unknown> | null;
  relatedEntityType?: string | null;
  relatedEntityId?: string | null;
  createdAt: string;
};

type TimelineResponse = {
  events: FinancialEvent[];
  nextCursor: string | null;
};

type FilterKey = 'all' | 'invoices' | 'quotes' | 'expenses' | 'income_profiles' | 'jobs';

type JobOption = { id: string; title: string };

const filterToTypes: Record<FilterKey, string[]> = {
  all: [],
  invoices: ['INVOICE_CREATED', 'INVOICE_UPDATED', 'INVOICE_STATUS_CHANGED'],
  quotes: ['QUOTE_CREATED', 'QUOTE_CONVERTED'],
  expenses: ['EXPENSE_CREATED', 'EXPENSE_UPDATED', 'EXPENSE_DELETED'],
  income_profiles: ['INCOME_PROFILE_UPDATED'],
  jobs: [
    'JOB_CREATED',
    'JOB_UPDATED',
    'JOB_STATUS_CHANGED',
    'DEPOSIT_POLICY_UPDATED',
    'JOB_DEPOSIT_PAID',
    'JOB_DEPOSIT_WAIVED',
  ],
};

function humanize(value: string): string {
  return value
    .toLowerCase()
    .split('_')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function metadataJobHint(metadata: Record<string, unknown> | null): string | null {
  if (!metadata) return null;
  const id = metadata.jobId;
  return typeof id === 'string' ? id : null;
}

export default function FinancialTimelineView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const jobFromUrl = searchParams.get('jobId');

  const [filter, setFilter] = useState<FilterKey>('all');
  const [jobScopeId, setJobScopeId] = useState<string | null>(jobFromUrl);
  const [jobOptions, setJobOptions] = useState<JobOption[]>([]);
  const [events, setEvents] = useState<FinancialEvent[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setJobScopeId(jobFromUrl);
  }, [jobFromUrl]);

  useEffect(() => {
    let cancelled = false;
    const loadJobs = async () => {
      try {
        const res = await fetch('/api/jobs', { credentials: 'same-origin' });
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as { id: string; title: string }[];
        if (!cancelled) {
          setJobOptions(data.map(j => ({ id: j.id, title: j.title })));
        }
      } catch {
        /* optional */
      }
    };
    void loadJobs();
    return () => {
      cancelled = true;
    };
  }, []);

  const setJobScope = useCallback(
    (id: string | null) => {
      setJobScopeId(id);
      const next = new URLSearchParams(searchParams.toString());
      if (id) {
        next.set('jobId', id);
      } else {
        next.delete('jobId');
      }
      const q = next.toString();
      router.replace(q ? `/financial-timeline?${q}` : '/financial-timeline', { scroll: false });
    },
    [router, searchParams]
  );

  const query = useMemo(() => {
    const params = new URLSearchParams({ limit: '50' });
    const selectedTypes = filterToTypes[filter];
    if (selectedTypes.length > 0) {
      params.set('types', selectedTypes.join(','));
    }
    if (jobScopeId) {
      params.set('jobId', jobScopeId);
    }
    return params.toString();
  }, [filter, jobScopeId]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/financial-events/timeline?${query}`, {
          method: 'GET',
          cache: 'no-store',
        });
        if (!response.ok) {
          if (mounted) {
            setEvents([]);
            setNextCursor(null);
            setError('Unable to load financial timeline.');
          }
          return;
        }
        const payload = (await response.json()) as TimelineResponse;
        if (mounted) {
          setEvents(payload.events ?? []);
          setNextCursor(payload.nextCursor ?? null);
        }
      } catch {
        if (mounted) {
          setEvents([]);
          setNextCursor(null);
          setError('Unable to load financial timeline.');
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };
    void load();
    return () => {
      mounted = false;
    };
  }, [query]);

  const loadMore = useCallback(async () => {
    if (!nextCursor || isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      const params = new URLSearchParams(query);
      params.set('cursor', nextCursor);
      const response = await fetch(`/api/financial-events/timeline?${params.toString()}`, {
        method: 'GET',
        cache: 'no-store',
      });
      if (!response.ok) return;
      const payload = (await response.json()) as TimelineResponse;
      setEvents(prev => [...prev, ...(payload.events ?? [])]);
      setNextCursor(payload.nextCursor ?? null);
    } catch {
      /* ignore */
    } finally {
      setIsLoadingMore(false);
    }
  }, [nextCursor, isLoadingMore, query]);

  let content: ReactElement;
  if (isLoading) {
    content = <p className="text-sm text-muted-foreground">Loading timeline...</p>;
  } else if (error) {
    content = <p className="text-sm text-destructive">{error}</p>;
  } else if (events.length === 0) {
    content = (
      <p className="text-sm text-muted-foreground">No financial events for this filter yet.</p>
    );
  } else {
    content = (
      <div className="space-y-3">
        {events.map(event => {
          const metaJob = metadataJobHint(event.metadata);
          return (
            <article key={event.id} className="rounded-md border p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold">{humanize(event.type)}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(event.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span>Source: {humanize(event.source)}</span>
                {typeof event.amount === 'number' ? (
                  <span>
                    Amount: {event.currency} {event.amount.toFixed(2)}
                  </span>
                ) : null}
              </div>
              {(event.relatedEntityType === 'JOB' && event.relatedEntityId) || metaJob ? (
                <p className="mt-2 text-xs text-muted-foreground">
                  {[
                    event.relatedEntityType === 'JOB' && event.relatedEntityId
                      ? `Job ${event.relatedEntityId}`
                      : null,
                    metaJob && metaJob !== event.relatedEntityId ? `Linked job ${metaJob}` : null,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              ) : null}
            </article>
          );
        })}
        {nextCursor ? (
          <div className="pt-2">
            <Button type="button" variant="outline" size="sm" disabled={isLoadingMore} onClick={() => void loadMore()}>
              {isLoadingMore ? 'Loading…' : 'Load more'}
            </Button>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-6 py-6">
      <div className="flex flex-wrap items-center gap-2">
        {(
          [
            { key: 'all', label: 'All' },
            { key: 'invoices', label: 'Invoices' },
            { key: 'quotes', label: 'Quotes' },
            { key: 'expenses', label: 'Expenses' },
            { key: 'income_profiles', label: 'Income Profiles' },
            { key: 'jobs', label: 'Jobs' },
          ] as const
        ).map(item => (
          <Button
            key={item.key}
            variant={filter === item.key ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(item.key)}
          >
            {item.label}
          </Button>
        ))}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
        <label htmlFor="timeline-job-scope" className="text-sm font-medium text-foreground">
          Job scope
        </label>
        <select
          id="timeline-job-scope"
          className="h-10 max-w-md rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          value={jobScopeId ?? ''}
          onChange={e => setJobScope(e.target.value || null)}
        >
          <option value="">All jobs (no scope)</option>
          {jobOptions.map(j => (
            <option key={j.id} value={j.id}>
              {j.title}
            </option>
          ))}
        </select>
        <p className="text-xs text-muted-foreground">
          Narrows events to this job (lifecycle + linked invoice/quote/expense metadata).
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Financial Timeline</CardTitle>
          <CardDescription>
            Unified event stream for invoices, quotes, expenses, income profiles, job activity, and deposit policy
            events.
            {jobScopeId ? ' Scoped to one job.' : null}
          </CardDescription>
        </CardHeader>
        <CardContent>{content}</CardContent>
      </Card>
    </div>
  );
}
