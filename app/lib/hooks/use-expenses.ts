import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export interface Expense {
  id: string;
  date: string;
  description: string;
  category: string;
  amount: number;
  tags?: string[];
  notes?: string;
  isRecurring?: boolean;
  frequency?: string;
  nextDueDate?: string;
}

export interface ExpenseFormData {
  date: Date;
  description: string;
  category: string;
  amount: string;
  tags?: string[];
  notes?: string;
  isRecurring?: boolean;
  frequency?: string;
  nextDueDate?: Date;
}

async function fetchExpenses(): Promise<Expense[]> {
  const response = await fetch('/api/expenses');
  if (!response.ok) {
    throw new Error('Failed to fetch expenses');
  }
  return response.json();
}

async function createExpense(data: ExpenseFormData): Promise<Expense> {
  const response = await fetch('/api/expenses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create expense');
  }

  return response.json();
}

async function updateExpense(id: string, data: ExpenseFormData): Promise<Expense> {
  const response = await fetch('/api/expenses', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ id, ...data }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update expense');
  }

  return response.json();
}

async function deleteExpense(id: string): Promise<void> {
  const response = await fetch(`/api/expenses?id=${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error('Failed to delete expense');
  }
}

export function useExpenses() {
  const queryClient = useQueryClient();

  const {
    data: expenses = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['expenses'],
    queryFn: fetchExpenses,
  });

  const createMutation = useMutation({
    mutationFn: createExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast.success('Expense created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ExpenseFormData }) => updateExpense(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast.success('Expense updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast.success('Expense deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  return {
    expenses,
    isLoading,
    error,
    createExpense: createMutation.mutate,
    updateExpense: updateMutation.mutate,
    deleteExpense: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
