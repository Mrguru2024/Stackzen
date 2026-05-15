import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import React, { useState } from 'react';

interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  userId: string;
}

export default function SavingsGoalTracker() {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');

  const {
    data: savingsGoals,
    isLoading,
    error,
  } = useQuery<SavingsGoal[]>({
    queryKey: ['savingsGoals'],
    queryFn: async () => {
      const res = await fetch('/api/savings-goals');
      if (!res.ok) throw new Error('Failed to fetch savings goals');
      return res.json();
    },
  });

  const createSavingsGoal = useMutation({
    mutationFn: async (newSavingsGoal: Omit<SavingsGoal, 'id'>) => {
      const res = await fetch('/api/savings-goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSavingsGoal),
      });
      if (!res.ok) throw new Error('Failed to create savings goal');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savingsGoals'] });
      setName('');
      setTargetAmount('');
      setCurrentAmount('');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createSavingsGoal.mutate({
      name,
      targetAmount: parseFloat(targetAmount),
      currentAmount: parseFloat(currentAmount) || 0,
      userId: 'user-id', // Replace with actual user ID from auth
    });
  };

  if (isLoading) return <div className="text-center">Loading...</div>;
  if (error) return <div className="text-center text-red-500">Error loading savings goals</div>;

  return (
    <div className="mx-auto max-w-4xl p-4">
      <h1 className="mb-6 text-2xl font-bold dark:text-white">Savings Goal Tracker</h1>
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Target Amount
          </label>
          <input
            type="number"
            value={targetAmount}
            onChange={e => setTargetAmount(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Current Amount
          </label>
          <input
            type="number"
            value={currentAmount}
            onChange={e => setCurrentAmount(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
          />
        </div>
        <button
          type="submit"
          className="hover:bg-primary-dark w-full rounded bg-primary px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary"
        >
          Add Savings Goal
        </button>
      </form>
      <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
        <h2 className="mb-4 text-lg font-semibold dark:text-white">Savings Goals List</h2>
        {savingsGoals?.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400">No savings goals yet.</p>
        ) : (
          <ul>
            {savingsGoals?.map(goal => (
              <li key={goal.id} className="mb-2">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {goal.name} - ${goal.currentAmount} / ${goal.targetAmount}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
