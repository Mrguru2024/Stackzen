'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CashflowWindow {
  windowDays: number;
  startingBalance: number;
  projectedEndingBalance: number;
  lowestProjectedBalance: number;
  expectedIncomeTotal: number;
  expectedBillsTotal: number;
  riskLevel: 'low' | 'medium' | 'high';
}

interface CashflowForecastResponse {
  windows?: CashflowWindow[];
  risks?: Array<{ severity: 'info' | 'warning' | 'critical'; summary: string }>;
}

function fmt(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

function riskTone(level?: 'low' | 'medium' | 'high'): string {
  if (level === 'high') return 'bg-red-500/10 text-red-700 dark:text-red-300';
  if (level === 'medium') return 'bg-amber-500/10 text-amber-700 dark:text-amber-300';
  return 'bg-green-500/10 text-green-700 dark:text-green-300';
}

function WindowTile({ win }: { win: CashflowWindow | undefined }) {
  if (!win) {
    return (
      <div className="rounded-lg border bg-card p-4">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="mt-3 h-7 w-24" />
        <Skeleton className="mt-3 h-4 w-32" />
      </div>
    );
  }
  const net = win.expectedIncomeTotal - win.expectedBillsTotal;
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Next {win.windowDays} days
        </p>
        <span
          className={cn(
            'rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide',
            riskTone(win.riskLevel)
          )}
        >
          {win.riskLevel}
        </span>
      </div>
      <p className="mt-2 text-2xl font-semibold">{fmt(win.projectedEndingBalance)}</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Lowest projected balance {fmt(win.lowestProjectedBalance)}
      </p>
      <div className="mt-3 flex items-center justify-between text-xs">
        <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400">
          <TrendingUp className="h-3 w-3" />
          {fmt(win.expectedIncomeTotal)}
        </span>
        <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400">
          <TrendingDown className="h-3 w-3" />
          {fmt(win.expectedBillsTotal)}
        </span>
        <span className={cn('font-medium', net >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400')}>
          {net >= 0 ? '+' : ''}
          {fmt(net)}
        </span>
      </div>
    </div>
  );
}

export default function CashFlowSnapshot() {
  const { data, isLoading, isError } = useQuery<CashflowForecastResponse>({
    queryKey: ['dashboard', 'cashflow-snapshot'],
    queryFn: async () => {
      const res = await fetch('/api/cashflow/forecast');
      if (!res.ok) throw new Error('forecast failed');
      return res.json();
    },
    staleTime: 60_000,
    retry: 1,
  });

  const w7 = data?.windows?.find(w => w.windowDays === 7);
  const w14 = data?.windows?.find(w => w.windowDays === 14);
  const w30 = data?.windows?.find(w => w.windowDays === 30);
  const criticalRisks = (data?.risks ?? []).filter(r => r.severity !== 'info');

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div>
          <CardTitle>Cash flow outlook</CardTitle>
          <CardDescription>Projected ending balance, lowest dip, and risk level by window.</CardDescription>
        </div>
        <Button asChild variant="ghost" size="sm">
          <Link href="/cash-flow">Open</Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {isError ? (
          <p className="text-sm text-muted-foreground">
            Couldn’t load cash flow forecast right now.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <WindowTile win={isLoading ? undefined : w7} />
            <WindowTile win={isLoading ? undefined : w14} />
            <WindowTile win={isLoading ? undefined : w30} />
          </div>
        )}
        {criticalRisks.length > 0 ? (
          <ul className="space-y-1 rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-sm">
            {criticalRisks.slice(0, 3).map(risk => (
              <li key={risk.summary} className="flex items-start gap-2">
                <span
                  className={cn(
                    'mt-1 h-1.5 w-1.5 shrink-0 rounded-full',
                    risk.severity === 'critical' ? 'bg-red-500' : 'bg-amber-500'
                  )}
                />
                <span>{risk.summary}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </CardContent>
    </Card>
  );
}
