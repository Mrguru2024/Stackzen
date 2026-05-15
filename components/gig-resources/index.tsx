'use client';

import React, { useMemo, useState } from 'react';
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

export default function GigResources() {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const query = useQuery<GigsResponse, Error>({
    queryKey: ['gig-resources', activeCategory ?? 'all'],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('page', '1');
      params.set('limit', '60');
      if (activeCategory) params.set('category', activeCategory);
      const res = await fetch(`/api/gigs?${params.toString()}`, { credentials: 'same-origin' });
      if (!res.ok) {
        throw new Error(`Failed to load gig resources (${res.status})`);
      }
      return res.json();
    },
    staleTime: 60_000,
  });

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const gig of query.data?.gigs ?? []) {
      if (gig.category) set.add(gig.category);
    }
    return Array.from(set).sort();
  }, [query.data]);

  const filteredGigs = useMemo(() => {
    const gigs = query.data?.gigs ?? [];
    const term = search.trim().toLowerCase();
    if (!term) return gigs;
    return gigs.filter(g =>
      [g.title, g.description ?? '', g.category, g.source]
        .some(field => field.toLowerCase().includes(term))
    );
  }, [query.data, search]);

  return (
    <div className="mx-auto max-w-5xl p-4">
      <h1 className="mb-6 text-2xl font-bold dark:text-white">Gig Platforms & Resources</h1>

      <div className="mb-6 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setActiveCategory(null)}
          className={`cursor-pointer rounded px-3 py-1 text-sm font-medium transition-colors ${
            activeCategory === null
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-foreground hover:bg-muted/70'
          }`}
        >
          All
        </button>
        {categories.map(cat => (
          <button
            type="button"
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`cursor-pointer rounded px-3 py-1 text-sm font-medium transition-colors ${
              activeCategory === cat
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-foreground hover:bg-muted/70'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="mb-6">
        <input
          type="text"
          placeholder="Search gig platforms..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full rounded border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-700 dark:bg-gray-900 dark:text-white"
        />
      </div>

      {query.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading gig platforms…</p>
      ) : query.error ? (
        <p className="text-sm text-destructive">{query.error.message}</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
          {filteredGigs.length > 0 ? (
            filteredGigs.map(gig => (
              <div
                key={gig.id}
                className="flex flex-col rounded-lg bg-white p-6 shadow dark:bg-gray-900"
              >
                <div className="mb-2 text-lg font-semibold dark:text-white">{gig.title}</div>
                <div className="mb-2 text-sm text-muted-foreground">{gig.category}</div>
                <div className="mb-4 flex-1 text-gray-700 dark:text-gray-300">
                  {gig.description}
                </div>
                <a
                  href={gig.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:bg-primary-dark mt-auto inline-block rounded bg-primary px-4 py-2 font-semibold text-primary-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  Visit Platform
                </a>
              </div>
            ))
          ) : (
            <div className="col-span-full rounded-md border border-dashed bg-card p-6 text-center text-sm text-muted-foreground">
              No gig platforms match your filters.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
