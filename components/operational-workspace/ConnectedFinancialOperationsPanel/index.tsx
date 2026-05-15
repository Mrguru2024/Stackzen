'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import type { ConnectivitySnapshotDto } from '@/lib/bank/connectivity-snapshot';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Landmark, RefreshCw } from 'lucide-react';

function stalenessBadge(staleness: string) {
  if (staleness === 'healthy') return <Badge variant="secondary">Healthy</Badge>;
  if (staleness === 'reconnect_required' || staleness === 'post_error')
    return <Badge variant="destructive">Action required</Badge>;
  return <Badge variant="outline">Attention</Badge>;
}

export default function ConnectedFinancialOperationsPanel() {
  const [data, setData] = useState<ConnectivitySnapshotDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncingId, setSyncingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/operational-center/connectivity', { credentials: 'same-origin' });
      if (!res.ok) throw new Error('load');
      setData((await res.json()) as ConnectivitySnapshotDto);
    } catch {
      toast.error('Could not load bank connectivity status');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const triggerSync = async (connectionId?: string) => {
    setSyncingId(connectionId ?? 'primary');
    try {
      const res = await fetch('/api/bank/sync', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(connectionId ? { connectionId } : {}),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string; createdCount?: number };
      if (!res.ok) {
        toast.error(json.error ?? 'Sync failed');
        return;
      }
      toast.success(
        typeof json.createdCount === 'number'
          ? `Sync completed · ${json.createdCount} ledger row(s) touched`
          : 'Sync completed'
      );
      await load();
    } catch {
      toast.error('Sync request failed');
    } finally {
      setSyncingId(null);
    }
  };

  if (loading) {
    return (
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-base">Bank & sync health</CardTitle>
          <CardDescription>Loading connectivity…</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-16 w-full rounded-lg" />
          <Skeleton className="h-16 w-full rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  const rows = data?.connections ?? [];

  return (
    <Card className="border-border">
      <CardHeader className="space-y-1">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Landmark className="h-5 w-5 shrink-0" aria-hidden />
          Bank & sync health
        </CardTitle>
        <CardDescription>
          Deterministic view of Plaid connections, last successful sync, and recent inflows ingested into{' '}
          <span className="font-medium text-foreground">FinancialTransaction</span>. Cash Flow uses linked balances —
          stale syncs reduce timing trust.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No bank connections on file. Link an institution from Money Control when your workspace is ready.
          </p>
        ) : (
          <ul className="space-y-3">
            {rows.map(r => (
              <li
                key={r.connectionId}
                className="rounded-lg border border-border bg-muted/20 p-3 text-sm sm:flex sm:items-start sm:justify-between sm:gap-4"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-foreground">{r.institutionName ?? 'Bank connection'}</span>
                    {stalenessBadge(r.staleness)}
                    <span className="text-xs text-muted-foreground">{r.provider}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Status: <span className="font-mono text-foreground">{r.status}</span>
                    {r.lastSuccessfulSyncAt
                      ? ` · Last success ${new Date(r.lastSuccessfulSyncAt).toLocaleString()}`
                      : ' · No successful sync recorded'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Accounts: {r.activeAccountCount} · Latest ledger postedAt:{' '}
                    {r.latestIngestedPostedAt ? new Date(r.latestIngestedPostedAt).toLocaleDateString() : '—'} · 14d
                    Plaid inflows: {r.recentPlaidInflowCount14d} (
                    {r.recentPlaidInflowSum14d >= 0 ? `$${r.recentPlaidInflowSum14d.toFixed(2)}` : '—'})
                  </p>
                  {r.latestJob?.status === 'FAILED' ? (
                    <p className="text-xs text-destructive">
                      Last job failed: {r.latestJob.errorMessage ?? r.latestJob.errorCode ?? 'unknown'}
                    </p>
                  ) : null}
                </div>
                <div className="mt-3 flex shrink-0 flex-col gap-2 sm:mt-0">
                  <Button
                    type="button"
                    variant="secondary"
                    size="default"
                    className="h-11 touch-manipulation sm:h-10"
                    disabled={syncingId !== null || r.status !== 'ACTIVE'}
                    onClick={() => void triggerSync(r.connectionId)}
                  >
                    <RefreshCw className="mr-2 h-4 w-4 shrink-0" aria-hidden />
                    {syncingId === r.connectionId ? 'Syncing…' : 'Sync this connection'}
                  </Button>
                  <Button variant="outline" size="default" className="h-11 touch-manipulation sm:h-10" asChild>
                    <Link href="/money-control?tab=review">Money Control</Link>
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="flex flex-col gap-2 border-t border-border pt-3 sm:flex-row sm:flex-wrap">
          <Button
            type="button"
            variant="secondary"
            size="default"
            className="h-11 w-full touch-manipulation sm:h-10 sm:w-auto"
            disabled={syncingId !== null || rows.length === 0}
            onClick={() => void triggerSync()}
          >
            <RefreshCw className="mr-2 h-4 w-4" aria-hidden />
            {syncingId === 'primary' ? 'Syncing…' : 'Run bank sync (first ACTIVE connection)'}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="default"
            className="h-11 w-full touch-manipulation sm:h-10 sm:w-auto"
            onClick={() => void load()}
          >
            Refresh status
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
