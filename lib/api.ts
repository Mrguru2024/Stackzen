import { getSession } from 'next-auth/react';

const API_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

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

    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);

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

  const response = await fetch(`${API_BASE_URL}${endpoint}`, options);

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Session expired. Please sign in again.');
    }
    const error = await response.json().catch(() => ({ message: 'An error occurred' }));
    throw new Error(error.message || 'An error occurred');
  }

  return response.json();
}

export async function fetchExpenseSummary() {
  return apiRequest<{
    totalExpenses: number;
    topCategories: Array<{ category: string; amount: number }>;
    trend: number;
  }>('GET', '/api/expense/summary');
}

export interface GoalProgress {
  id: string;
  title: string;
  currentAmount: number;
  targetAmount: number;
  percentComplete: number;
}

export interface CashFlowSummary {
  income: number;
  expenses: number;
  netCashFlow: number;
  period: string;
}

export async function fetchCashFlowSummary() {
  return apiRequest<CashFlowSummary>('GET', '/api/cashflow/summary');
}

export async function fetchGoalProgress() {
  return apiRequest<GoalProgress[]>('GET', '/api/goals/progress');
}

export interface Income {
  id: string;
  amount: number;
  description: string;
  startDate: Date;
  endDate?: Date;
  frequency: 'one-time' | 'weekly' | 'bi-weekly' | 'monthly' | 'yearly';
  category: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IncomeSummary {
  totalIncome: number;
  averageIncome: number;
  incomeByCategory: {
    category: string;
    amount: number;
  }[];
}

export interface IncomeChartData {
  date: string;
  amount: number;
}

export async function fetchIncomeList() {
  return apiRequest<Income[]>('GET', '/api/income');
}

export async function fetchIncomeSummary() {
  return apiRequest<IncomeSummary>('GET', '/api/income/summary');
}

export async function fetchIncomeChart() {
  return apiRequest<IncomeChartData[]>('GET', '/api/income/chart');
}
