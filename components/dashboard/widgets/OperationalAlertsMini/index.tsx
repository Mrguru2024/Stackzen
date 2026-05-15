'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertOctagon, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

type UiPriority = 'critical' | 'warning' | 'informational' | 'resolved';

interface AlertItem {
  id: string;
  title: string;
  body: string;
  uiPriority: UiPriority;
  domain: string;
  createdAt: string;
  inAttentionQueue: boolean;
  suppressed: boolean;
}

interface AlertsResponse {
  alerts?: AlertItem[];
}

function priorityIcon(priority: UiPriority): React.ComponentType<{ className?: string }> {
  if (priority === 'critical') return AlertOctagon;
  if (priority === 'warning') return AlertTriangle;
  if (priority === 'resolved') return CheckCircle2;
  return Info;
}

function priorityTone(priority: UiPriority): string {
  if (priority === 'critical') return 'text-red-500';
  if (priority === 'warning') return 'text-amber-500';
  if (priority === 'resolved') return 'text-green-500';
  return 'text-blue-500';
}

function priorityRank(priority: UiPriority): number {
  if (priority === 'critical') return 0;
  if (priority === 'warning') return 1;
  if (priority === 'informational') return 2;
  return 3;
}

export default function OperationalAlertsMini() {
  const { data, isLoading, isError } = useQuery<AlertsResponse>({
    queryKey: ['dashboard', 'operational-alerts-mini'],
    queryFn: async () => {
      const res = await fetch('/api/operational-center/alerts');
      if (!res.ok) throw new Error('alerts failed');
      return res.json();
    },
    staleTime: 30_000,
    retry: 1,
  });

  const attention = (data?.alerts ?? [])
    .filter(a => a.inAttentionQueue && !a.suppressed)
    .sort((a, b) => {
      const rank = priorityRank(a.uiPriority) - priorityRank(b.uiPriority);
      if (rank !== 0) return rank;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    })
    .slice(0, 5);

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div>
          <CardTitle>Needs attention</CardTitle>
          <CardDescription>
            Top alerts from cashflow, allocations, income intelligence, and invoices.
          </CardDescription>
        </div>
        <Button asChild variant="ghost" size="sm">
          <Link href="/operational-center">Open all</Link>
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <ul className="space-y-3">
            {[0, 1, 2].map(i => (
              <li key={i} className="flex items-start gap-3">
                <Skeleton className="h-5 w-5 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                </div>
              </li>
            ))}
          </ul>
        ) : isError ? (
          <p className="text-sm text-muted-foreground">Couldn’t load alerts right now.</p>
        ) : attention.length === 0 ? (
          <div className="flex items-center gap-3 rounded-md bg-green-500/10 p-4 text-sm">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            <span>You’re all caught up — no items need attention right now.</span>
          </div>
        ) : (
          <ul className="space-y-3">
            {attention.map(alert => {
              const Icon = priorityIcon(alert.uiPriority);
              return (
                <li key={alert.id} className="flex items-start gap-3">
                  <Icon className={cn('mt-0.5 h-5 w-5 shrink-0', priorityTone(alert.uiPriority))} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{alert.title}</p>
                    <p className="line-clamp-2 text-xs text-muted-foreground">{alert.body}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
