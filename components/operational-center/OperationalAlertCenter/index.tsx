'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type {
  OperationalAlertDto,
  OperationalUiDomain,
  OperationalAlertsResponseDto,
} from '@/lib/operational-notifications/types';
import { OperationalAlertCards } from '@/components/operational-center/OperationalAlertCards';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

type QueueFilter = 'attention' | 'resolved' | 'all';

export interface OperationalAlertCenterProps {
  embedded?: boolean;
}

const DOMAIN_LABEL: Record<OperationalUiDomain | 'all', string> = {
  all: 'All domains',
  financial: 'Financial ledger',
  automation: 'Automation & rules',
  work: 'Jobs & gigs',
  invoice: 'Invoices',
  billing: 'Deposits & payouts',
  goals: 'Operational goals',
  guidance: 'Financial guidance',
};

export default function OperationalAlertCenter({ embedded = false }: OperationalAlertCenterProps) {
  const [alerts, setAlerts] = useState<OperationalAlertDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [queueFilter, setQueueFilter] = useState<QueueFilter>('attention');
  const [domain, setDomain] = useState<OperationalUiDomain | 'all'>('all');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/operational-center/alerts?ensure=true`, {
        credentials: 'same-origin',
      });
      if (!res.ok) throw new Error('Failed to load alerts');
      const data = (await res.json()) as OperationalAlertsResponseDto;
      setAlerts(data.alerts);
    } catch {
      toast.error('Could not load operational alerts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredByDomain = useMemo(
    () => (domain === 'all' ? alerts : alerts.filter(a => a.domain === domain)),
    [alerts, domain]
  );

  const queued = useMemo(() => {
    if (queueFilter === 'attention') {
      return filteredByDomain.filter(a => a.inAttentionQueue);
    }
    if (queueFilter === 'resolved') {
      return filteredByDomain.filter(a => a.uiPriority === 'resolved');
    }
    return filteredByDomain;
  }, [filteredByDomain, queueFilter]);

  const attentionCount = useMemo(() => alerts.filter(a => a.inAttentionQueue).length, [alerts]);

  const markAllRead = async () => {
    const res = await fetch(`/api/notifications/read-all`, { method: 'PATCH', credentials: 'same-origin' });
    if (!res.ok) {
      toast.error('Could not mark all read');
      return;
    }
    toast.success('All alerts marked read');
    await load();
  };

  const headerTitle = embedded ? 'Operational alerts' : 'Operational attention center';

  const headerDescription = embedded
    ? 'Same prioritized queue as the full center — correct money and work items from metadata actions.'
    : 'One actionable surface for invoices, jobs, automation, ledger review, and trust-first explanations. Derived from AutomationNotification rows plus invoice/job reconciliation (no passive-only feed).';

  return (
    <div className="space-y-6">
      {!embedded ? (
        <header className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{headerTitle}</h1>
          <p className="max-w-3xl text-sm text-muted-foreground md:text-base">{headerDescription}</p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/financial-timeline">Financial timeline</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/cash-flow">Cash flow</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/money-control">Money control ledger</Link>
            </Button>
            <Button variant="outline" size="sm" onClick={() => void markAllRead()}>
              Mark all read
            </Button>
            <Button size="sm" disabled={loading} onClick={() => void load()}>
              Refresh
            </Button>
          </div>
        </header>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">{headerTitle}</h2>
            <p className="text-sm text-muted-foreground">{headerDescription}</p>
          </div>
          <Button size="sm" variant="outline" disabled={loading} onClick={() => void load()}>
            Refresh
          </Button>
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>Queue ({attentionCount} need attention)</CardTitle>
            <CardDescription>
              Filters respect read/snooze/dismiss semantics. Snoozed and dismissed items fall out of the attention
              queue until cleared.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Select value={domain} onValueChange={v => setDomain(v as OperationalUiDomain | 'all')}>
              <SelectTrigger className="w-[200px]" aria-label="Domain filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(DOMAIN_LABEL) as Array<keyof typeof DOMAIN_LABEL>).map(key => (
                  <SelectItem key={key} value={key}>
                    {DOMAIN_LABEL[key]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-wrap gap-2" role="tablist" aria-label="Queue filter">
            {(
              [
                ['attention', 'Attention'],
                ['resolved', 'Resolved'],
                ['all', 'All'],
              ] as const
            ).map(([key, label]) => (
              <Button
                key={key}
                type="button"
                variant={queueFilter === key ? 'default' : 'outline'}
                size="sm"
                onClick={() => setQueueFilter(key)}
              >
                {label}
              </Button>
            ))}
          </div>
          {loading ? (
            <p className="text-muted-foreground">Loading operational alerts...</p>
          ) : (
            <OperationalAlertCards items={queued} onMutate={load} compactTrust={embedded} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
