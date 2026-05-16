import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface StackZenGig {
  id: string;
  title: string;
  description: string;
  category: string;
  duration: string;
  budget: number;
  rating: number;
  postedBy: string;
  skills: string[];
  isProOnly: boolean;
  createdAt: string;
  updatedAt: string;
}

export function useStackZenGigs() {
  return useQuery<StackZenGig[]>({
    queryKey: ['/api/gigs'],
    queryFn: async () => {
      const res = await fetch('/api/gigs');
      if (!res.ok) throw new Error('Failed to fetch gigs');
      return res.json();
    },
  });
}

export function useCreateStackZenGig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (gig: Omit<StackZenGig, 'id' | 'createdAt' | 'updatedAt'>) => {
      const res = await fetch('/api/gigs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(gig),
      });
      if (!res.ok) throw new Error('Failed to create gig');
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/gigs'] }),
  });
}

export function useUpdateStackZenGig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (gig: Partial<StackZenGig> & { id: string }) => {
      const res = await fetch('/api/gigs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(gig),
      });
      if (!res.ok) throw new Error('Failed to update gig');
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/gigs'] }),
  });
}

export function useDeleteStackZenGig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch('/api/gigs', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error('Failed to delete gig');
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/gigs'] }),
  });
}
