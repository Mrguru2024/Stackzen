import React from 'react';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';

interface Gig {
  id: string;
  title: string;
  category: string;
  tags: string[];
  curated: boolean;
  createdAt: string;
}

export default function FeaturedGigsManager() {
  const { data: session, status } = useSession();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  // Only allow admins
  const isAdmin = session?.user?.role === 'ADMIN';

  const { data: gigs, isLoading } = useQuery<Gig[]>({
    queryKey: ['/api/aggregated-gigs/all'],
    queryFn: async () => {
      const res = await fetch('/api/aggregated-gigs/all');
      if (!res.ok) throw new Error('Failed to fetch gigs');
      return res.json();
    },
  });

  const toggleCurated = useMutation({
    mutationFn: async ({ id, curated }: { id: string; curated: boolean }) => {
      const res = await fetch(`/api/aggregated-gigs/${id}/curated`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ curated }),
      });
      if (!res.ok) throw new Error('Failed to update featured status');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['/api/aggregated-gigs/all']);
    },
    onError: (err: any) => {
      setError(err.message || 'Failed to update featured status');
    },
  });

  if (status === 'loading') return <div className="py-8 text-center">Loading session...</div>;
  if (!isAdmin) return <div className="py-8 text-center text-red-500">Admin access only.</div>;

  return (
    <div className="mx-auto max-w-4xl p-4">
      <h2 className="mb-6 text-2xl font-bold dark:text-white">Featured Gigs Manager</h2>
      {error && <div className="mb-4 text-red-500">{error}</div>}
      {isLoading ? (
        <div className="py-8 text-center">Loading gigs...</div>
      ) : (
        <table className="w-full rounded border bg-white dark:bg-gray-900">
          <thead>
            <tr className="border-b dark:border-gray-700">
              <th className="p-3 text-left">Title</th>
              <th className="p-3 text-left">Category</th>
              <th className="p-3 text-left">Tags</th>
              <th className="p-3 text-center">Featured</th>
              <th className="p-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {gigs?.map(gig => (
              <tr key={gig.id} className="border-b dark:border-gray-800">
                <td className="p-3 font-medium dark:text-white">{gig.title}</td>
                <td className="p-3 text-gray-700 dark:text-gray-300">{gig.category}</td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-1">
                    {gig.tags.map(tag => (
                      <span
                        key={tag}
                        className="rounded bg-blue-100 px-2 py-1 text-xs text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="p-3 text-center">
                  <span
                    className={`inline-block rounded px-2 py-1 text-xs font-semibold ${gig.curated ? 'bg-green-200 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}`}
                  >
                    {gig.curated ? 'Yes' : 'No'}
                  </span>
                </td>
                <td className="p-3 text-center">
                  <button
                    className={`rounded px-3 py-1 ${gig.curated ? 'bg-gray-300 text-gray-800 dark:bg-gray-700 dark:text-gray-200' : 'bg-primary text-white'}`}
                    onClick={() => toggleCurated.mutate({ id: gig.id, curated: !gig.curated })}
                  >
                    {gig.curated ? 'Unfeature' : 'Feature'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
