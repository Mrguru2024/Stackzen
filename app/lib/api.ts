import { getSession } from 'next-auth/react';

export async function apiRequest<T>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  endpoint: string,
  data?: any
): Promise<T> {
  // In development, skip session check
  if (process.env.NODE_ENV === 'development') {
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    };

    if (data && method !== 'GET') {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(`/api${endpoint}`, options);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'An error occurred' }));
      throw new Error(error.message || 'An error occurred');
    }

    return response.json();
  }

  // Production mode - check session
  const session = await getSession();

  if (!session) {
    throw new Error('Not authenticated');
  }

  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  };

  if (data && method !== 'GET') {
    options.body = JSON.stringify(data);
  }

  const response = await fetch(`/api${endpoint}`, options);

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Session expired. Please sign in again.');
    }
    const error = await response.json().catch(() => ({ message: 'An error occurred' }));
    throw new Error(error.message || 'An error occurred');
  }

  return response.json();
}

// TypeScript interfaces for API responses
export interface IncomeSummary {
  totalIncome: number;
  monthlyGrowth: number;
  activeClients: number;
  clientGrowth: number;
  pendingInvoices: number;
  invoiceGrowth: number;
  growthRate: number;
  hourlyGrowth: number;
}

export interface IncomeChart {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
  }[];
}

export interface IncomeListItem {
  id: string;
  client: string | null;
  amount: number;
  date: Date | string;
  status: string;
  type: string;
}

export interface ExpenseSummary {
  totalExpenses: number;
  topCategories: { category: string; amount: number }[];
  trend: number;
}

export interface CashFlowSummary {
  totalIncome: number;
  totalExpenses: number;
  netCashFlow: number;
}

export interface GoalProgress {
  id: string;
  title: string;
  currentAmount: number;
  targetAmount: number;
  percentComplete: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
}

export async function fetchIncomeSummary(): Promise<IncomeSummary> {
  const response = await fetch('/api/income/summary');
  if (!response.ok) {
    throw new Error('Failed to fetch income summary');
  }
  return response.json();
}

export async function fetchIncomeChart(): Promise<IncomeChart> {
  const response = await fetch('/api/income/chart');
  if (!response.ok) {
    throw new Error('Failed to fetch income chart data');
  }
  return response.json();
}

export async function fetchIncomeList(): Promise<IncomeListItem[]> {
  const response = await fetch('/api/income/list');
  if (!response.ok) {
    throw new Error('Failed to fetch income list');
  }
  return response.json();
}

export async function fetchExpenseSummary(): Promise<ExpenseSummary> {
  const response = await fetch('/api/expense/summary');
  if (!response.ok) {
    throw new Error('Failed to fetch expense summary');
  }
  return response.json();
}

export async function fetchCashFlowSummary(): Promise<CashFlowSummary> {
  const response = await fetch('/api/cashflow/summary');
  if (!response.ok) {
    throw new Error('Failed to fetch cash flow summary');
  }
  return response.json();
}

export async function fetchGoalProgress(): Promise<GoalProgress[]> {
  const response = await fetch('/api/goals/progress');
  if (!response.ok) {
    throw new Error('Failed to fetch goal progress');
  }
  return response.json();
}

export async function fetchUser(): Promise<User> {
  const response = await fetch('/api/user');
  if (!response.ok) {
    throw new Error('Failed to fetch user');
  }
  return response.json();
}
