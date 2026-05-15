import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import type { SummaryMetric } from '@components/dashboard/SummaryPanel';

export interface DashboardData {
  summaryMetrics: SummaryMetric[];
  recentTransactions: Array<{
    id: string;
    description: string;
    amount: number;
    direction: 'INFLOW' | 'OUTFLOW';
    postedAt: string;
  }>;
  upcomingBills: Array<{
    id: string;
    name: string;
    amount: number;
    dueDate: string;
    frequency: string;
  }>;
  savingsProgress: {
    goal: number;
    current: number;
    percentage: number;
  };
  hasData: boolean;
}

interface IncomeSummaryResponse {
  totalIncome?: number;
}

interface CashflowForecastResponse {
  windows?: Array<{
    windowDays: number;
    expectedBillsTotal?: number;
    expectedIncomeTotal?: number;
  }>;
}

interface DashboardSummaryResponse {
  income?: number;
  expenses?: number;
}

interface RecentTransactionsResponse {
  items: Array<{
    id: string;
    description: string;
    amount: number;
    direction: 'INFLOW' | 'OUTFLOW';
    postedAt: string;
  }>;
}

interface UpcomingBillsResponse {
  items: Array<{
    id: string;
    name: string;
    amount: number;
    dueDate: string;
    frequency: string;
  }>;
}

interface SavingsGoalRow {
  id: string;
  targetAmount: number;
  currentAmount: number;
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { credentials: 'same-origin' });
  if (!res.ok) {
    throw new Error(`Failed: ${url} (${res.status})`);
  }
  return res.json();
}

async function loadDashboardData(): Promise<DashboardData> {
  const [income, summary, forecast, savingsGoals, recentTxResp, upcomingBillsResp] =
    await Promise.allSettled([
      fetchJson<IncomeSummaryResponse>('/api/income/summary'),
      fetchJson<DashboardSummaryResponse>('/api/dashboard/summary'),
      fetchJson<CashflowForecastResponse>('/api/cashflow/forecast'),
      fetchJson<SavingsGoalRow[]>('/api/savings-goals'),
      fetchJson<RecentTransactionsResponse>('/api/transactions?limit=5'),
      fetchJson<UpcomingBillsResponse>('/api/automation/budget-breakdown?upcomingOnly=true&limit=5'),
    ]);

  const incomeTotal =
    income.status === 'fulfilled' ? income.value.totalIncome ?? 0 : 0;
  const summaryIncome = summary.status === 'fulfilled' ? summary.value.income ?? incomeTotal : incomeTotal;
  const summaryExpenses = summary.status === 'fulfilled' ? summary.value.expenses ?? 0 : 0;
  const window30 =
    forecast.status === 'fulfilled'
      ? forecast.value.windows?.find(w => w.windowDays === 30) ?? null
      : null;
  const expectedIncome = window30?.expectedIncomeTotal ?? 0;
  const expectedBills = window30?.expectedBillsTotal ?? 0;
  const netSavings = Math.max(0, summaryIncome - summaryExpenses);

  const goalRows = savingsGoals.status === 'fulfilled' ? savingsGoals.value : [];
  const goalTotal = goalRows.reduce((sum, g) => sum + g.targetAmount, 0);
  const goalCurrent = goalRows.reduce((sum, g) => sum + g.currentAmount, 0);

  const summaryMetrics: SummaryMetric[] = [
    {
      label: 'Total Income (this month)',
      value: Math.round(summaryIncome * 100) / 100,
      currency: 'USD',
    },
    {
      label: 'Total Expenses (this month)',
      value: Math.round(summaryExpenses * 100) / 100,
      currency: 'USD',
    },
    {
      label: 'Net Savings (this month)',
      value: Math.round(netSavings * 100) / 100,
      currency: 'USD',
    },
    {
      label: 'Expected Income (30d)',
      value: Math.round(expectedIncome * 100) / 100,
      currency: 'USD',
    },
    {
      label: 'Expected Bills (30d)',
      value: Math.round(expectedBills * 100) / 100,
      currency: 'USD',
    },
  ];

  const recentTransactions =
    recentTxResp.status === 'fulfilled' ? recentTxResp.value.items ?? [] : [];
  const upcomingBills =
    upcomingBillsResp.status === 'fulfilled' ? upcomingBillsResp.value.items ?? [] : [];

  return {
    summaryMetrics,
    recentTransactions,
    upcomingBills,
    savingsProgress: {
      goal: Math.round(goalTotal * 100) / 100,
      current: Math.round(goalCurrent * 100) / 100,
      percentage: goalTotal > 0 ? Math.round((goalCurrent / goalTotal) * 100) : 0,
    },
    hasData:
      summaryIncome > 0 ||
      summaryExpenses > 0 ||
      goalRows.length > 0 ||
      recentTransactions.length > 0,
  };
}

/**
 * Custom hook for fetching dashboard data. Returns aggregated metrics,
 * recent transactions, upcoming bills, and savings progress for the
 * authenticated user.
 */
export function useDashboardData() {
  const { status } = useSession();
  const query = useQuery<DashboardData, Error>({
    queryKey: ['dashboard', 'aggregate'],
    queryFn: loadDashboardData,
    enabled: status === 'authenticated',
    staleTime: 5 * 60 * 1000,
  });

  return {
    dashboardData: query.data ?? null,
    isLoading: query.isLoading || status === 'loading',
    error: query.error,
    refetch: query.refetch,
    isAuthenticated: status === 'authenticated',
  };
}
