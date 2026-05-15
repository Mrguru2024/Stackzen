import { useState, useCallback } from 'react';

interface FinancialGoal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline: Date;
  category: string;
}

export function useFinancialGoals() {
  const [goals, setGoals] = useState<FinancialGoal[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const addGoal = useCallback(async (goal: Omit<FinancialGoal, 'id'>) => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/financial-goals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(goal),
      });

      if (!response.ok) {
        throw new Error('Failed to add goal');
      }

      const newGoal = await response.json();
      setGoals(prev => [...prev, newGoal]);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to add goal'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateGoal = useCallback(async (goal: FinancialGoal) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/financial-goals/${goal.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(goal),
      });

      if (!response.ok) {
        throw new Error('Failed to update goal');
      }

      const updatedGoal = await response.json();
      setGoals(prev => prev.map(g => (g.id === goal.id ? updatedGoal : g)));
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update goal'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteGoal = useCallback(async (id: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/financial-goals/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete goal');
      }

      setGoals(prev => prev.filter(g => g.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to delete goal'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchGoals = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/financial-goals');

      if (!response.ok) {
        throw new Error('Failed to fetch goals');
      }

      const data = await response.json();
      setGoals(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch goals'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    goals,
    isLoading,
    error,
    addGoal,
    updateGoal,
    deleteGoal,
    fetchGoals,
  };
}
