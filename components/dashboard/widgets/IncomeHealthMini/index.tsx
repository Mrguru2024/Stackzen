'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Activity, AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface IncomeIntelligenceSnapshot {
  concentration?: {
    herfindahlIndex?: number;
    topSources?: Array<{ label: string; shareOfTotal: number; totalUsd: number }>;
  };
  delayedIncome?: Array<{ label: string; daysPastExpected: number }>;
  irregularPayouts?: Array<{ series: { label: string } }>;
  decliningPayouts?: Array<{ label: string }>;
}

function fmtPct(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function concentrationTone(index: number | undefined): { label: string; tone: string } {
  if (index == null) return { label: 'Unknown', tone: 'text-muted-foreground' };
  if (index >= 0.65) return { label: 'High concentration', tone: 'text-amber-600 dark:text-amber-400' };
  if (index >= 0.4) return { label: 'Moderate concentration', tone: 'text-blue-600 dark:text-blue-400' };
  return { label: 'Well diversified', tone: 'text-green-600 dark:text-green-400' };
}

export default function IncomeHealthMini() {
  const { data, isLoading, isError } = useQuery<IncomeIntelligenceSnapshot>({
    queryKey: ['dashboard', 'income-health-mini'],
    queryFn: async () => {
      const res = await fetch('/api/operational-center/income-intelligence?ensure=false');
      if (!res.ok) throw new Error('income intelligence failed');
      return res.json();
    },
    staleTime: 120_000,
    retry: 1,
  });

  const hhi = data?.concentration?.herfindahlIndex;
  const topSource = data?.concentration?.topSources?.[0] ?? null;
  const delayedCount = data?.delayedIncome?.length ?? 0;
  const irregularCount = data?.irregularPayouts?.length ?? 0;
  const decliningCount = data?.decliningPayouts?.length ?? 0;
  const concentration = concentrationTone(hhi);

  const allClear = delayedCount === 0 && irregularCount === 0 && decliningCount === 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div>
          <CardTitle>Income health</CardTitle>
          <CardDescription>Concentration, delays, and irregular payout signals.</CardDescription>
        </div>
        <Button asChild variant="ghost" size="sm">
          <Link href="/income-hub">Details</Link>
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ) : isError ? (
          <p className="text-sm text-muted-foreground">Couldn’t load income intelligence right now.</p>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Activity className={cn('h-5 w-5', concentration.tone)} />
              <div className="text-sm">
                <p className={cn('font-medium', concentration.tone)}>{concentration.label}</p>
                <p className="text-xs text-muted-foreground">
                  HHI {hhi != null ? hhi.toFixed(2) : '—'}
                  {topSource ? ` • Top source: ${topSource.label} (${fmtPct(topSource.shareOfTotal)})` : ''}
                </p>
              </div>
            </div>

            {allClear ? (
              <div className="flex items-center gap-3 rounded-md bg-green-500/10 p-3 text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span>No delayed, irregular, or declining payouts detected.</span>
              </div>
            ) : (
              <ul className="space-y-2 text-sm">
                {delayedCount > 0 ? (
                  <li className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-500" />
                    <span>
                      <strong>{delayedCount}</strong> delayed deposit{delayedCount === 1 ? '' : 's'} past expected date
                    </span>
                  </li>
                ) : null}
                {irregularCount > 0 ? (
                  <li className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-500" />
                    <span>
                      <strong>{irregularCount}</strong> irregular payout series detected
                    </span>
                  </li>
                ) : null}
                {decliningCount > 0 ? (
                  <li className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <span>
                      <strong>{decliningCount}</strong> declining payout trend{decliningCount === 1 ? '' : 's'}
                    </span>
                  </li>
                ) : null}
              </ul>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
