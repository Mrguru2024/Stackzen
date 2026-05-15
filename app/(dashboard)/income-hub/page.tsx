'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ThemeToggle } from '@/components/ThemeToggle';
import { fetchUser } from '@/app/lib/api';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import IncomeTimeline from '@/components/IncomeTimeline';
import JobBasedIncome from '@/components/JobBasedIncome';
import { Skeleton } from '@/components/ui/skeleton';
// Lazy load heavy components
const IncomeChart = dynamic(() => import('@/components/dashboard/income-chart'), {
  loading: () => <div className="h-64 animate-pulse rounded-lg bg-gray-100" />,
  ssr: false,
});

const IncomeList = dynamic(() => import('@/components/dashboard/income-list'), {
  loading: () => <div className="h-64 animate-pulse rounded-lg bg-gray-100" />,
  ssr: false,
});

const IncomeSummary = dynamic(() => import('@/components/dashboard/income-summary'), {
  loading: () => (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-32 animate-pulse rounded-lg bg-gray-100" />
      ))}
    </div>
  ),
  ssr: false,
});

interface User {
  id: string;
  email: string;
  name: string;
}

export default function IncomeHub() {
  const { data: session, status } = useSession();
  const { data: user, isLoading: isLoadingUser } = useQuery<User>({
    queryKey: ['/api/user'],
    queryFn: fetchUser,
    enabled: !!session?.user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  if (status === 'loading' || isLoadingUser) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="p-6">
          <h2 className="text-xl font-semibold">Please sign in to view your income hub</h2>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-8 px-4 py-6">
      <div className="flex items-center justify-between pb-8 pt-6">
        <h1 className="text-2xl font-bold">Income Hub</h1>
        <ThemeToggle />
      </div>

      <Card className="border-primary/20 bg-primary/5 dark:bg-primary/10">
        <div className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-foreground">
            Connect your bank, Cash App, Venmo, and other payout sources so income totals stay
            complete.
          </p>
          <Link
            href="/income/sources"
            className="inline-flex shrink-0 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Manage income sources
          </Link>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-8">
        <Suspense
          fallback={
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 animate-pulse rounded-lg bg-gray-100" />
              ))}
            </div>
          }
        >
          <IncomeSummary />
        </Suspense>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <Suspense fallback={<div className="h-64 animate-pulse rounded-lg bg-gray-100" />}>
            <IncomeChart />
          </Suspense>
          <Suspense fallback={<div className="h-64 animate-pulse rounded-lg bg-gray-100" />}>
            <IncomeList />
          </Suspense>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <IncomeTimeline />
          <JobBasedIncome />
        </div>
      </div>
    </div>
  );
}
