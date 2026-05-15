'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';

interface IncomeTimelinePoint {
  date: string;
  [source: string]: string | number;
}

interface IncomeTimelineResponse {
  series: IncomeTimelinePoint[];
  sources: string[];
  hasData: boolean;
}

const PALETTE = [
  '#7F5CF1',
  '#34D399',
  '#F59E0B',
  '#3B82F6',
  '#EF4444',
  '#10B981',
  '#A855F7',
  '#EC4899',
];

export default function IncomeTimeline() {
  const { status } = useSession();
  const query = useQuery<IncomeTimelineResponse, Error>({
    queryKey: ['income', 'timeline'],
    queryFn: async () => {
      const res = await fetch('/api/income/timeline?days=30', { credentials: 'same-origin' });
      if (!res.ok) {
        throw new Error(`Failed to load income timeline (${res.status})`);
      }
      return res.json();
    },
    enabled: status === 'authenticated',
    staleTime: 60_000,
  });

  return (
    <div className="w-full rounded-lg bg-card p-4 shadow">
      <h2 className="mb-2 text-lg font-semibold">Income Timeline</h2>
      <div className="h-[250px] w-full">
        {status === 'loading' || query.isLoading ? (
          <Skeleton className="h-full w-full" />
        ) : query.error ? (
          <div className="flex h-full items-center justify-center text-sm text-destructive">
            {query.error.message}
          </div>
        ) : !query.data || !query.data.hasData ? (
          <div className="flex h-full flex-col items-center justify-center text-center text-sm text-muted-foreground">
            <p>No income recorded in the last 30 days.</p>
            <p>Log a job, invoice, or connect your bank to populate this view.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={query.data.series}
              margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              {query.data.sources.map((source, idx) => (
                <Line
                  key={source}
                  type="monotone"
                  dataKey={source}
                  stroke={PALETTE[idx % PALETTE.length]}
                  strokeWidth={2}
                  dot={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
