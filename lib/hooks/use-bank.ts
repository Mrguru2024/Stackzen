'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export interface BankTransaction {
  transaction_id: string;
  date: string;
  name: string;
  amount: number;
  category: string[];
  pending: boolean;
}

interface TransactionFilters {
  search?: string;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  categories?: string[];
}

interface TransactionPagination {
  page: number;
  pageSize: number;
}

async function handleResponse(response: Response) {
  const contentType = response.headers.get('content-type');
  const isJson = contentType?.includes('application/json');

  if (!response.ok) {
    if (isJson) {
      const error = await response.json();
      throw new Error(error.error || 'An error occurred');
    }
    const text = await response.text();
    if (text === 'Unauthorized') {
      throw new Error('Unauthorized access');
    }
    throw new Error(text || 'An error occurred');
  }

  if (isJson) {
    return response.json();
  }
  return response.text();
}

function reportError(error: unknown, fallback: string, unauthorizedMessage: string) {
  if (error instanceof Error) {
    if (error.message === 'Unauthorized' || error.message === 'Unauthorized access') {
      toast.error(unauthorizedMessage);
    } else {
      toast.error(error.message);
    }
  } else {
    toast.error(fallback);
  }
}

export function useBank() {
  const queryClient = useQueryClient();

  const { data: linkToken, isLoading: isLoadingLinkToken } = useQuery({
    queryKey: ['bank-link-token'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/bank/link-token');
        const data = await handleResponse(response);
        return data.link_token;
      } catch (error) {
        console.error('Error fetching link token:', error);
        reportError(
          error,
          'Failed to get link token',
          'Please sign in to connect your bank account'
        );
        return null;
      }
    },
    retry: false,
  });

  const { data: transactions, isLoading: isLoadingTransactions } = useQuery({
    queryKey: ['bank-transactions'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/bank/transactions');
        return handleResponse(response);
      } catch (error) {
        console.error('Error fetching transactions:', error);
        reportError(error, 'Failed to fetch transactions', 'Please sign in to view transactions');
        throw error;
      }
    },
    enabled: false,
    retry: false,
  });

  const exchangeMutation = useMutation({
    mutationFn: async ({
      publicToken,
      institution,
    }: {
      publicToken: string;
      institution: string;
    }) => {
      try {
        const response = await fetch('/api/bank/exchange-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ publicToken, institution }),
        });
        return handleResponse(response);
      } catch (error) {
        console.error('Error exchanging token:', error);
        reportError(
          error,
          'Failed to connect bank account',
          'Please sign in to connect your bank account'
        );
        throw error;
      }
    },
    onSuccess: () => {
      toast.success('Bank account connected successfully');
      queryClient.invalidateQueries({ queryKey: ['bank-transactions'] });
    },
  });

  const importMutation = useMutation({
    mutationFn: async (transactionsToImport: BankTransaction[]) => {
      try {
        const response = await fetch('/api/expenses/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transactions: transactionsToImport }),
        });
        return handleResponse(response);
      } catch (error) {
        console.error('Error importing transactions:', error);
        reportError(
          error,
          'Failed to import transactions',
          'Please sign in to import transactions'
        );
        throw error;
      }
    },
    onSuccess: () => {
      toast.success('Transactions imported successfully');
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
  });

  const filterTransactions = (
    items: BankTransaction[],
    filters: TransactionFilters
  ): BankTransaction[] => {
    return items.filter(transaction => {
      const matchesSearch =
        !filters.search || transaction.name.toLowerCase().includes(filters.search.toLowerCase());

      const matchesDate =
        (!filters.startDate || transaction.date >= filters.startDate) &&
        (!filters.endDate || transaction.date <= filters.endDate);

      const matchesAmount =
        (!filters.minAmount || transaction.amount >= filters.minAmount) &&
        (!filters.maxAmount || transaction.amount <= filters.maxAmount);

      const matchesCategory =
        !filters.categories?.length ||
        transaction.category.some(cat => filters.categories?.includes(cat));

      return matchesSearch && matchesDate && matchesAmount && matchesCategory;
    });
  };

  const paginateTransactions = (
    items: BankTransaction[],
    pagination: TransactionPagination
  ): BankTransaction[] => {
    const start = (pagination.page - 1) * pagination.pageSize;
    const end = start + pagination.pageSize;
    return items.slice(start, end);
  };

  return {
    linkToken: linkToken || null,
    transactions,
    isLoadingLinkToken,
    isLoadingTransactions,
    exchangeToken: (variables: { publicToken: string; institution: string }) =>
      exchangeMutation.mutateAsync(variables),
    importTransactions: (transactionsToImport: BankTransaction[]) =>
      importMutation.mutateAsync(transactionsToImport),
    isImporting: importMutation.isPending,
    filterTransactions,
    paginateTransactions,
  };
}
