import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';

export interface DashboardAnalytics {
  totalRevenue: number;
  activeClients: number;
  pendingInvoices: number;
  growthRate: number;
  revenueChange: number;
  clientsChange: number;
  invoicesChange: number;
  growthChange: number;
}

async function fetchDashboardAnalytics(): Promise<DashboardAnalytics> {
  const res = await fetch('/api/dashboard/analytics', { credentials: 'same-origin' });
  if (!res.ok) {
    throw new Error(`Failed to load dashboard analytics (${res.status})`);
  }
  return res.json();
}

export function useDashboardAnalytics() {
  const { status } = useSession();
  const query = useQuery<DashboardAnalytics, Error>({
    queryKey: ['dashboard', 'analytics'],
    queryFn: fetchDashboardAnalytics,
    enabled: status === 'authenticated',
    staleTime: 60_000,
  });

  return {
    data: query.data ?? null,
    loading: query.isLoading || status === 'loading',
    error: query.error ? query.error.message : null,
    refetch: query.refetch,
    isAuthenticated: status === 'authenticated',
  };
}
