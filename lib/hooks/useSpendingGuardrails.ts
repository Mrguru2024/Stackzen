import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { SpendingGuardrail } from '@/lib/types/financial-wellness';

const API_BASE = '/api/guardrails';

export function useSpendingGuardrails() {
  const queryClient = useQueryClient();

  const { data: guardrails = [], isLoading } = useQuery({
    queryKey: ['guardrails'],
    queryFn: async () => {
      const response = await fetch(API_BASE);
      if (!response.ok) {
        throw new Error('Failed to fetch guardrails');
      }
      return response.json() as Promise<SpendingGuardrail[]>;
    },
  });

  const addGuardrail = useMutation({
    mutationFn: async (guardrail: Omit<SpendingGuardrail, 'id'>) => {
      const response = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(guardrail),
      });
      if (!response.ok) {
        throw new Error('Failed to add guardrail');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guardrails'] });
      toast.success('Spending limit added successfully');
    },
    onError: () => {
      toast.error('Failed to add spending limit');
    },
  });

  const updateGuardrail = useMutation({
    mutationFn: async (guardrail: SpendingGuardrail) => {
      const response = await fetch(`${API_BASE}/${guardrail.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(guardrail),
      });
      if (!response.ok) {
        throw new Error('Failed to update guardrail');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guardrails'] });
      toast.success('Spending limit updated successfully');
    },
    onError: () => {
      toast.error('Failed to update spending limit');
    },
  });

  const deleteGuardrail = useMutation({
    mutationFn: async (guardrailId: string) => {
      const response = await fetch(`${API_BASE}/${guardrailId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete guardrail');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guardrails'] });
      toast.success('Spending limit deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete spending limit');
    },
  });

  const toggleGuardrail = useMutation({
    mutationFn: async (guardrailId: string) => {
      const guardrail = guardrails.find(g => g.id === guardrailId);
      if (!guardrail) {
        throw new Error('Guardrail not found');
      }

      const response = await fetch(`${API_BASE}/${guardrailId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notifications: !guardrail.notifications,
        }),
      });
      if (!response.ok) {
        throw new Error('Failed to toggle guardrail');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guardrails'] });
      toast.success('Notifications updated successfully');
    },
    onError: () => {
      toast.error('Failed to update notifications');
    },
  });

  return {
    guardrails,
    isLoading,
    addGuardrail: addGuardrail.mutate,
    updateGuardrail: updateGuardrail.mutate,
    deleteGuardrail: deleteGuardrail.mutate,
    toggleGuardrail: toggleGuardrail.mutate,
  };
}
