import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserFinancialData, WellnessScore, FinancialGoal } from '@/lib/types/wellness';

// API endpoints
const WELLNESS_ENDPOINT = '/api/wellness';
const GOALS_ENDPOINT = '/api/wellness/goals';

// Fetch wellness data
async function fetchWellnessData() {
  const response = await fetch(WELLNESS_ENDPOINT);
  if (!response.ok) {
    throw new Error('Failed to fetch wellness data');
  }
  return response.json();
}

// Update wellness score
async function updateWellnessScore(userData: UserFinancialData) {
  const response = await fetch(WELLNESS_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userData }),
  });
  if (!response.ok) {
    throw new Error('Failed to update wellness score');
  }
  return response.json();
}

// Fetch financial goals
async function fetchFinancialGoals() {
  const response = await fetch(GOALS_ENDPOINT);
  if (!response.ok) {
    throw new Error('Failed to fetch financial goals');
  }
  return response.json();
}

// Create financial goal
async function createFinancialGoal(
  goal: Omit<FinancialGoal, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
) {
  const response = await fetch(GOALS_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(goal),
  });
  if (!response.ok) {
    throw new Error('Failed to create financial goal');
  }
  return response.json();
}

// Update financial goal
async function updateFinancialGoal(goal: Partial<FinancialGoal> & { id: string }) {
  const response = await fetch(GOALS_ENDPOINT, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(goal),
  });
  if (!response.ok) {
    throw new Error('Failed to update financial goal');
  }
  return response.json();
}

// Delete financial goal
async function deleteFinancialGoal(id: string) {
  const response = await fetch(`${GOALS_ENDPOINT}?id=${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete financial goal');
  }
  return response.json();
}

export function useWellness() {
  const queryClient = useQueryClient();

  // Wellness score queries
  const {
    data: wellnessData,
    isLoading: isLoadingWellness,
    error: wellnessError,
  } = useQuery({
    queryKey: ['wellness'],
    queryFn: fetchWellnessData,
  });

  const updateScoreMutation = useMutation({
    mutationFn: updateWellnessScore,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wellness'] });
    },
  });

  // Financial goals queries
  const {
    data: goals,
    isLoading: isLoadingGoals,
    error: goalsError,
  } = useQuery({
    queryKey: ['financialGoals'],
    queryFn: fetchFinancialGoals,
  });

  const createGoalMutation = useMutation({
    mutationFn: createFinancialGoal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financialGoals'] });
    },
  });

  const updateGoalMutation = useMutation({
    mutationFn: updateFinancialGoal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financialGoals'] });
    },
  });

  const deleteGoalMutation = useMutation({
    mutationFn: deleteFinancialGoal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financialGoals'] });
    },
  });

  return {
    // Wellness score
    wellnessScore: wellnessData?.score as WellnessScore | undefined,
    isLoadingWellness,
    wellnessError,
    updateWellnessScore: updateScoreMutation.mutate,
    isUpdatingScore: updateScoreMutation.isPending,

    // Financial goals
    goals: goals as FinancialGoal[] | undefined,
    isLoadingGoals,
    goalsError,
    createGoal: createGoalMutation.mutate,
    updateGoal: updateGoalMutation.mutate,
    deleteGoal: deleteGoalMutation.mutate,
    isUpdatingGoal: updateGoalMutation.isPending,
    isDeletingGoal: deleteGoalMutation.isPending,
  };
}
