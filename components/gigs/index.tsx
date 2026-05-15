'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';

interface GigRow {
  id: string;
  title: string;
  description: string | null;
  url: string;
  source: string;
  category: string;
  postedAt: string;
}

interface GigsResponse {
  gigs: GigRow[];
  pagination: { total: number; page: number; limit: number; pages: number };
}

export default function Gigs() {
  const query = useQuery<GigsResponse, Error>({
    queryKey: ['gigs', 'page', 1],
    queryFn: async () => {
      const res = await fetch('/api/gigs?page=1&limit=20', { credentials: 'same-origin' });
      if (!res.ok) {
        throw new Error(`Failed to load gigs (${res.status})`);
      }
      return res.json();
    },
    staleTime: 60_000,
  });

  return (
    <div className="mx-auto max-w-3xl p-4">
      <h1 className="mb-6 text-2xl font-bold dark:text-white">Gigs & Opportunities</h1>
      {query.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading gigs…</p>
      ) : query.error ? (
        <p className="text-sm text-destructive">{query.error.message}</p>
      ) : !query.data || query.data.gigs.length === 0 ? (
        <div className="rounded-md border border-dashed bg-card p-6 text-center text-sm text-muted-foreground">
          No gigs available right now. Check back soon for new opportunities.
        </div>
      ) : (
        <div className="grid gap-6">
          {query.data.gigs.map(gig => (
            <div
              key={gig.id}
              className="flex flex-col rounded-lg bg-white p-6 shadow dark:bg-gray-900 md:flex-row md:items-center md:justify-between"
            >
              <div>
                <h2 className="mb-1 text-lg font-semibold dark:text-white">{gig.title}</h2>
                {gig.description ? (
                  <p className="mb-2 text-gray-600 dark:text-gray-300">{gig.description}</p>
                ) : null}
                <span className="inline-block rounded bg-blue-100 px-2 py-1 text-xs text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  {gig.source}
                </span>
              </div>
              <a
                href={gig.url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:bg-primary-dark mt-4 inline-block rounded bg-primary px-4 py-2 text-white transition-colors md:mt-0"
              >
                View Platform
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
