'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface IncomeChartPoint {
  date: string;
  amount: number;
}

interface IncomeChartProps {
  data?: IncomeChartPoint[];
}

export default function IncomeChart({ data: dataProp }: IncomeChartProps) {
  const [chartType, setChartType] = useState<'bar' | 'line'>('bar');
  const { status } = useSession();

  const query = useQuery<IncomeChartPoint[], Error>({
    queryKey: ['income', 'chart'],
    queryFn: async () => {
      const res = await fetch('/api/income/chart', { credentials: 'same-origin' });
      if (!res.ok) {
        throw new Error(`Failed to load income chart (${res.status})`);
      }
      return res.json();
    },
    enabled: !dataProp && status === 'authenticated',
    staleTime: 60_000,
  });

  const chartData = dataProp ?? query.data ?? [];
  const isLoading = !dataProp && (query.isLoading || status === 'loading');

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Income Chart</h3>
          <div className="flex gap-2">
            <button
              type="button"
              className={`rounded px-3 py-1 ${chartType === 'bar' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'}`}
              onClick={() => setChartType('bar')}
            >
              Bar
            </button>
            <button
              type="button"
              className={`rounded px-3 py-1 ${chartType === 'line' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'}`}
              onClick={() => setChartType('line')}
            >
              Line
            </button>
          </div>
        </div>
        <div className="h-72 w-full">
          {isLoading ? (
            <Skeleton className="h-full w-full" />
          ) : query.error ? (
            <div className="flex h-full items-center justify-center text-sm text-destructive">
              {query.error.message}
            </div>
          ) : chartData.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center text-sm text-muted-foreground">
              <p>No income recorded yet.</p>
              <p>Connect a bank account or log income to see this chart.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'bar' ? (
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="amount" fill="#10b981" name="Income" radius={[4, 4, 0, 0]} />
                </BarChart>
              ) : (
                <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="amount"
                    stroke="#10b981"
                    name="Income"
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              )}
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
