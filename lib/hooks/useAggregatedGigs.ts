import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';

export interface AggregatedGig {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  source: string;
  url: string;
  createdAt: string;
  expiresAt: string;
  payEstimate?: string;
  location?: string;
  curated: boolean;
}

export function useAggregatedGigs() {
  return useQuery<AggregatedGig[]>({
    queryKey: ['/api/aggregated-gigs'],
    queryFn: async () => {
      const res = await fetch('/api/aggregated-gigs');
      if (!res.ok) throw new Error('Failed to fetch gigs');
      return res.json();
    },
  });
}

export function useUserFavorites() {
  const { status } = useSession();
  return useQuery<string[]>({
    queryKey: ['/api/aggregated-gigs/favorites'],
    queryFn: async () => {
      const res = await fetch('/api/aggregated-gigs/favorites');
      if (!res.ok) throw new Error('Failed to fetch favorites');
      return res.json();
    },
    enabled: status === 'authenticated',
  });
}

export function useAddFavoriteGig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (gigId: string) => {
      const res = await fetch('/api/aggregated-gigs/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gigId }),
      });
      if (!res.ok) throw new Error('Failed to add favorite');
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries(['/api/aggregated-gigs/favorites']),
  });
}

export function useRemoveFavoriteGig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (gigId: string) => {
      const res = await fetch('/api/aggregated-gigs/favorites', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gigId }),
      });
      if (!res.ok) throw new Error('Failed to remove favorite');
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries(['/api/aggregated-gigs/favorites']),
  });
}

export function useCurateGig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, curated }: { id: string; curated: boolean }) => {
      const res = await fetch('/api/aggregated-gigs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, curated }),
      });
      if (!res.ok) throw new Error('Failed to update gig');
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries(['/api/aggregated-gigs']),
  });
}

export function useDeleteGig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch('/api/aggregated-gigs', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error('Failed to delete gig');
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries(['/api/aggregated-gigs']),
  });
}
