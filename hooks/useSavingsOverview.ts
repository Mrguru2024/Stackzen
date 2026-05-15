import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';

export interface SavingsAccountRow {
  id: string;
  name: string;
  balance: number;
  interestRate: number;
  institution: string | null;
  isConnected: boolean;
}

export interface SavingsGoalRow {
  id: string;
  name: string;
  description: string | null;
  targetAmount: number;
  currentAmount: number;
  category: string;
  targetDate: string | null;
  progress: number;
}

export interface SavingsActivityRow {
  id: string;
  type: 'deposit' | 'withdrawal';
  amount: number;
  date: string;
  description: string;
}

export interface SavingsOverview {
  totalSavings: number;
  monthlySavings: number;
  monthlyTarget: number;
  yearToDate: number;
  projectedAnnual: number;
  savingsRate: number;
  goalsProgress: number;
  challengesCompleted: number;
  activeGoals: number;
  accounts: SavingsAccountRow[];
  goals: SavingsGoalRow[];
  recentActivity: SavingsActivityRow[];
  hasData: boolean;
  generatedAt: string;
}

export function useSavingsOverview() {
  const { status } = useSession();
  const query = useQuery<SavingsOverview, Error>({
    queryKey: ['savings', 'overview'],
    queryFn: async () => {
      const res = await fetch('/api/savings/overview', { credentials: 'same-origin' });
      if (!res.ok) {
        throw new Error(`Failed to load savings overview (${res.status})`);
      }
      return res.json();
    },
    enabled: status === 'authenticated',
    staleTime: 60_000,
  });

  return {
    data: query.data ?? null,
    isLoading: query.isLoading || status === 'loading',
    error: query.error ? query.error.message : null,
    refetch: query.refetch,
    isAuthenticated: status === 'authenticated',
  };
}
