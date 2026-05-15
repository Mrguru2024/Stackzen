'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import Progress from '@/components/ui/progress';
import { Target } from 'lucide-react';

interface OperationalGoal {
  id: string;
  name: string;
  targetAmount: number;
  bucketBalance: number;
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED' | string;
  priority: number;
  analysis?: { onTrack?: boolean; projectedCompletionDate?: string | null } | null;
}

interface GoalsResponse {
  goals?: OperationalGoal[];
}

function fmt(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

export default function GoalsProgressMini() {
  const { data, isLoading, isError } = useQuery<GoalsResponse>({
    queryKey: ['dashboard', 'goals-mini'],
    queryFn: async () => {
      const res = await fetch('/api/goals/operational');
      if (!res.ok) throw new Error('goals failed');
      return res.json();
    },
    staleTime: 60_000,
    retry: 1,
  });

  const activeGoals = (data?.goals ?? [])
    .filter(g => g.status === 'ACTIVE')
    .sort((a, b) => a.priority - b.priority)
    .slice(0, 3);

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div>
          <CardTitle>Goals progress</CardTitle>
          <CardDescription>Top active goals with current bucket balance vs target.</CardDescription>
        </div>
        <Button asChild variant="ghost" size="sm">
          <Link href="/goals/operational">Manage</Link>
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <ul className="space-y-4">
            {[0, 1, 2].map(i => (
              <li key={i} className="space-y-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-2 w-full" />
              </li>
            ))}
          </ul>
        ) : isError ? (
          <p className="text-sm text-muted-foreground">Couldn’t load goals right now.</p>
        ) : activeGoals.length === 0 ? (
          <div className="flex items-center gap-3 rounded-md border border-dashed p-4 text-sm">
            <Target className="h-5 w-5 text-muted-foreground" />
            <span className="text-muted-foreground">
              You don’t have any active goals yet.{' '}
              <Link href="/goals/operational" className="text-primary underline">
                Set your first goal
              </Link>
              .
            </span>
          </div>
        ) : (
          <ul className="space-y-4">
            {activeGoals.map(goal => {
              const pct = goal.targetAmount > 0
                ? Math.min(100, Math.round((goal.bucketBalance / goal.targetAmount) * 100))
                : 0;
              const onTrack = goal.analysis?.onTrack ?? null;
              return (
                <li key={goal.id} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="truncate font-medium">{goal.name}</span>
                    <span className="shrink-0 text-muted-foreground">
                      {fmt(goal.bucketBalance)} / {fmt(goal.targetAmount)}
                    </span>
                  </div>
                  <Progress value={pct} className="h-2" />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{pct}% funded</span>
                    {onTrack === false ? (
                      <span className="text-amber-600 dark:text-amber-400">Behind pace</span>
                    ) : onTrack === true ? (
                      <span className="text-green-600 dark:text-green-400">On track</span>
                    ) : null}
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
