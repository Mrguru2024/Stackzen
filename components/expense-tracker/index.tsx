import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import React, { useState } from 'react';

interface Expense {
  id: string;
  amount: number;
  description?: string;
  date: string;
  userId: string;
}

export default function ExpenseTracker() {
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');

  const {
    data: expenses,
    isLoading,
    error,
  } = useQuery<Expense[]>({
    queryKey: ['expenses'],
    queryFn: async () => {
      const res = await fetch('/api/expenses');
      if (!res.ok) throw new Error('Failed to fetch expenses');
      return res.json();
    },
  });

  const createExpense = useMutation({
    mutationFn: async (newExpense: Omit<Expense, 'id'>) => {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newExpense),
      });
      if (!res.ok) throw new Error('Failed to create expense');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      setAmount('');
      setDescription('');
      setDate('');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createExpense.mutate({
      amount: parseFloat(amount),
      description,
      date,
      userId: 'user-id', // Replace with actual user ID from auth
    });
  };

  if (isLoading) return <div className="text-center">Loading...</div>;
  if (error) return <div className="text-center text-red-500">Error loading expenses</div>;

  return (
    <div className="mx-auto max-w-4xl p-4">
      <h1 className="mb-6 text-2xl font-bold dark:text-white">Expense Tracker</h1>
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Amount
          </label>
          <input
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Description
          </label>
          <input
            type="text"
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Date</label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
            required
          />
        </div>
        <button
          type="submit"
          className="hover:bg-primary-dark w-full rounded bg-primary px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary"
        >
          Add Expense
        </button>
      </form>
      <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
        <h2 className="mb-4 text-lg font-semibold dark:text-white">Expense List</h2>
        {expenses?.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400">No expenses yet.</p>
        ) : (
          <ul>
            {expenses?.map(expense => (
              <li key={expense.id} className="mb-2">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  ${expense.amount} - {expense.description} -{' '}
                  {new Date(expense.date).toLocaleDateString()}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
