'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, Users, DollarSign, FileText } from 'lucide-react';
import { useDashboardAnalytics } from '@/hooks/useDashboardAnalytics';

interface AnalyticsCardProps {
  label: string;
  value: string;
  changeLabel: string;
  changeTone: 'positive' | 'negative' | 'neutral';
  Icon: React.ComponentType<{ className?: string }>;
  iconClassName: string;
  loading: boolean;
}

function AnalyticsCard({
  label,
  value,
  changeLabel,
  changeTone,
  Icon,
  iconClassName,
  loading,
}: AnalyticsCardProps) {
  const toneClass =
    changeTone === 'positive'
      ? 'text-green-600 dark:text-green-400'
      : changeTone === 'negative'
        ? 'text-red-600 dark:text-red-400'
        : 'text-muted-foreground';

  const ChangeIcon = changeTone === 'negative' ? TrendingDown : TrendingUp;

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
            {!loading && changeLabel ? (
              <div className={`mt-2 flex items-center gap-1 text-sm ${toneClass}`}>
                <ChangeIcon className="h-4 w-4" />
                <span>{changeLabel}</span>
              </div>
            ) : null}
          </div>
          <Icon className={`h-8 w-8 shrink-0 ${iconClassName}`} />
        </div>
      </CardContent>
    </Card>
  );
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

function pctLabel(value: number, suffix: string): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value}% ${suffix}`;
}

export function AnalyticsCards() {
  const { data, loading, error, isAuthenticated } = useDashboardAnalytics();

  if (!isAuthenticated) {
    return (
      <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
        Sign in to view your live analytics.
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-6 text-sm text-destructive">
        {error}
      </div>
    );
  }

  const totalRevenue = data?.totalRevenue ?? 0;
  const activeClients = data?.activeClients ?? 0;
  const pendingInvoices = data?.pendingInvoices ?? 0;
  const growthRate = data?.growthRate ?? 0;
  const revenueChange = data?.revenueChange ?? 0;
  const clientsChange = data?.clientsChange ?? 0;
  const invoicesChange = data?.invoicesChange ?? 0;
  const growthChange = data?.growthChange ?? 0;

  return (
    <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
      <AnalyticsCard
        label="Total Revenue"
        value={formatCurrency(totalRevenue)}
        changeLabel={pctLabel(revenueChange, 'vs last month')}
        changeTone={revenueChange >= 0 ? 'positive' : 'negative'}
        Icon={DollarSign}
        iconClassName="text-green-500"
        loading={loading}
      />
      <AnalyticsCard
        label="Active Clients"
        value={activeClients.toLocaleString()}
        changeLabel={pctLabel(clientsChange, 'vs last month')}
        changeTone={clientsChange >= 0 ? 'positive' : 'negative'}
        Icon={Users}
        iconClassName="text-blue-500"
        loading={loading}
      />
      <AnalyticsCard
        label="Pending Invoices"
        value={pendingInvoices.toString()}
        changeLabel={`${invoicesChange >= 0 ? '+' : ''}${invoicesChange} vs last month`}
        changeTone={invoicesChange <= 0 ? 'positive' : 'negative'}
        Icon={FileText}
        iconClassName="text-yellow-500"
        loading={loading}
      />
      <AnalyticsCard
        label="Growth Rate"
        value={`${growthRate >= 0 ? '+' : ''}${growthRate}%`}
        changeLabel={pctLabel(growthChange, 'month over month')}
        changeTone={growthChange >= 0 ? 'positive' : 'negative'}
        Icon={TrendingUp}
        iconClassName="text-purple-500"
        loading={loading}
      />
    </div>
  );
}
