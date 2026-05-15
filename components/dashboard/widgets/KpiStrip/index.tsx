'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Bell,
  DollarSign,
  TrendingUp,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface IncomeSummaryResponse {
  totalIncome?: number;
  averageIncome?: number;
  breakdown?: {
    servicesBookings?: number;
    manualLedger?: number;
    bankDepositsSynced?: number;
  };
}

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
}

interface OperationalAlertsResponse {
  alerts?: Array<{ inAttentionQueue?: boolean; suppressed?: boolean }>;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

interface KpiCardProps {
  label: string;
  value: string;
  hint?: string | null;
  hintTone?: 'positive' | 'negative' | 'warning' | 'neutral';
  Icon: React.ComponentType<{ className?: string }>;
  iconClassName?: string;
  loading: boolean;
}

function KpiCard({ label, value, hint, hintTone = 'neutral', Icon, iconClassName, loading }: KpiCardProps) {
  const toneClass =
    hintTone === 'positive'
      ? 'text-green-600 dark:text-green-400'
      : hintTone === 'negative'
        ? 'text-red-600 dark:text-red-400'
        : hintTone === 'warning'
          ? 'text-amber-600 dark:text-amber-400'
          : 'text-muted-foreground';

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm text-muted-foreground">{label}</p>
            {loading ? (
              <Skeleton className="mt-2 h-8 w-32" />
            ) : (
              <p className="mt-1 text-3xl font-bold tracking-tight">{value}</p>
            )}
            {hint ? (
              <p className={cn('mt-2 text-sm', toneClass)}>{hint}</p>
            ) : null}
          </div>
          <Icon className={cn('h-8 w-8 shrink-0', iconClassName)} />
        </div>
      </CardContent>
    </Card>
  );
}

export default function KpiStrip() {
  const incomeQuery = useQuery<IncomeSummaryResponse>({
    queryKey: ['dashboard', 'kpi', 'income-summary'],
    queryFn: async () => {
      const res = await fetch('/api/income/summary');
      if (!res.ok) throw new Error('income summary failed');
      return res.json();
    },
    staleTime: 60_000,
    retry: 1,
  });

  const cashflowQuery = useQuery<CashflowForecastResponse>({
    queryKey: ['dashboard', 'kpi', 'cashflow-forecast'],
    queryFn: async () => {
      const res = await fetch('/api/cashflow/forecast');
      if (!res.ok) throw new Error('cashflow forecast failed');
      return res.json();
    },
    staleTime: 60_000,
    retry: 1,
  });

  const alertsQuery = useQuery<OperationalAlertsResponse>({
    queryKey: ['dashboard', 'kpi', 'operational-alerts'],
    queryFn: async () => {
      const res = await fetch('/api/operational-center/alerts?ensure=false');
      if (!res.ok) throw new Error('alerts failed');
      return res.json();
    },
    staleTime: 60_000,
    retry: 1,
  });

  const incomeTotal = incomeQuery.data?.totalIncome ?? 0;
  const window30 = cashflowQuery.data?.windows?.find(w => w.windowDays === 30) ?? null;
  const expectedIncome30 = window30?.expectedIncomeTotal ?? 0;
  const expectedBills30 = window30?.expectedBillsTotal ?? 0;
  const lowest30 = window30?.lowestProjectedBalance ?? null;
  const projectedEnd30 = window30?.projectedEndingBalance ?? null;
  const riskLevel = window30?.riskLevel ?? null;
  const attentionCount = (alertsQuery.data?.alerts ?? []).filter(
    a => a.inAttentionQueue && !a.suppressed
  ).length;

  const runwayHint =
    lowest30 == null
      ? null
      : lowest30 < 0
        ? `Projected dip to ${formatCurrency(lowest30)}`
        : `Stays above ${formatCurrency(lowest30)}`;

  const runwayTone: KpiCardProps['hintTone'] =
    lowest30 == null
      ? 'neutral'
      : lowest30 < 0
        ? 'negative'
        : riskLevel === 'high'
          ? 'warning'
          : riskLevel === 'medium'
            ? 'warning'
            : 'positive';

  const expectedTone: KpiCardProps['hintTone'] =
    expectedIncome30 - expectedBills30 > 0 ? 'positive' : 'negative';

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <KpiCard
        label="Income this month"
        value={formatCurrency(incomeTotal)}
        hint={
          incomeQuery.data?.breakdown
            ? `Bookings ${formatCurrency(
                incomeQuery.data.breakdown.servicesBookings ?? 0
              )} • Bank ${formatCurrency(incomeQuery.data.breakdown.bankDepositsSynced ?? 0)}`
            : null
        }
        hintTone="neutral"
        Icon={DollarSign}
        iconClassName="text-green-500"
        loading={incomeQuery.isLoading}
      />
      <KpiCard
        label="Expected next 30 days"
        value={formatCurrency(expectedIncome30)}
        hint={`Bills ${formatCurrency(expectedBills30)} • Net ${formatCurrency(
          expectedIncome30 - expectedBills30
        )}`}
        hintTone={expectedTone}
        Icon={expectedTone === 'positive' ? ArrowUpRight : ArrowDownRight}
        iconClassName={expectedTone === 'positive' ? 'text-green-500' : 'text-red-500'}
        loading={cashflowQuery.isLoading}
      />
      <KpiCard
        label="30-day runway"
        value={projectedEnd30 != null ? formatCurrency(projectedEnd30) : '—'}
        hint={runwayHint}
        hintTone={runwayTone}
        Icon={TrendingUp}
        iconClassName="text-blue-500"
        loading={cashflowQuery.isLoading}
      />
      <KpiCard
        label="Needs attention"
        value={attentionCount.toString()}
        hint={attentionCount === 0 ? 'You’re all caught up' : 'Open the attention queue to review'}
        hintTone={attentionCount === 0 ? 'positive' : 'warning'}
        Icon={attentionCount === 0 ? Bell : AlertTriangle}
        iconClassName={attentionCount === 0 ? 'text-muted-foreground' : 'text-amber-500'}
        loading={alertsQuery.isLoading}
      />
    </div>
  );
}
