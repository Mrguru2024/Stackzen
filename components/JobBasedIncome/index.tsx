'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui';
import { Skeleton } from '@/components/ui/skeleton';

interface IncomeBySourceItem {
  jobTag: string;
  amount: number;
  count: number;
}

interface IncomeBySourceResponse {
  items: IncomeBySourceItem[];
  totalIncome: number;
  hasData: boolean;
}

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n);

export default function JobBasedIncome() {
  const { status } = useSession();
  const query = useQuery<IncomeBySourceResponse, Error>({
    queryKey: ['income', 'by-source'],
    queryFn: async () => {
      const res = await fetch('/api/income/by-source?months=3', { credentials: 'same-origin' });
      if (!res.ok) {
        throw new Error(`Failed to load income breakdown (${res.status})`);
      }
      return res.json();
    },
    enabled: status === 'authenticated',
    staleTime: 60_000,
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Income by Job/Project</CardTitle>
        </CardHeader>
        <CardContent>
          {status === 'loading' || query.isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-[300px] w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : query.error ? (
            <p className="text-sm text-destructive">{query.error.message}</p>
          ) : !query.data?.hasData ? (
            <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
              <p>No job-based income recorded in the last 3 months.</p>
              <p>Create a job, log invoice income, or import bank deposits to populate this.</p>
            </div>
          ) : (
            <>
              <div className="mb-4 h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={query.data.items}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="jobTag" />
                    <YAxis />
                    <Tooltip formatter={(v: number) => formatCurrency(v)} />
                    <Bar dataKey="amount" fill="#7F5CF1" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-2">
                {query.data.items.map(job => (
                  <div
                    key={job.jobTag}
                    className="flex items-center justify-between rounded bg-muted/40 p-2"
                  >
                    <div>
                      <span className="font-medium">{job.jobTag}</span>
                      <Badge variant="secondary" className="ml-2">
                        {job.count} item{job.count === 1 ? '' : 's'}
                      </Badge>
                    </div>
                    <span className="font-semibold">{formatCurrency(job.amount)}</span>
                  </div>
                ))}
                <div className="mt-4 border-t pt-2">
                  <div className="flex items-center justify-between font-bold">
                    <span>Total Income</span>
                    <span>{formatCurrency(query.data.totalIncome)}</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
