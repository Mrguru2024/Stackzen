import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface GigApplication {
  id: string;
  gigId: string;
  userId: string;
  status: string;
  data: {
    name: string;
    email: string;
    phone?: string;
    portfolio?: string;
    coverLetter: string;
    experience: string;
    availability: string;
    rate?: string;
    additionalInfo?: string;
  };
  createdAt: string;
  updatedAt: string;
  gig: {
    title: string;
  };
  user: {
    name: string;
    email: string;
  };
}

export function useGigApplications() {
  const queryClient = useQueryClient();

  const {
    data: applications,
    isLoading,
    error,
  } = useQuery<GigApplication[]>({
    queryKey: ['/api/aggregated-gigs/applications'],
    queryFn: async () => {
      const res = await fetch('/api/aggregated-gigs/applications');
      if (!res.ok) throw new Error('Failed to fetch applications');
      return res.json();
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await fetch(`/api/aggregated-gigs/applications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Failed to update application status');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['/api/aggregated-gigs/applications']);
    },
  });

  return {
    applications,
    isLoading,
    error,
    updateStatus,
  };
}
