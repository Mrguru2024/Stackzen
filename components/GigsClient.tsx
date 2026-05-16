'use client';

import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/ui/icons';
import { _formatDate } from '@/lib/utils/format';
import type { AggregatedGig } from '@/lib/hooks/useAggregatedGigs';

interface GigsClientProps {
  initialGigs: AggregatedGig[];
  category: string;
}

export default function GigsClient({ initialGigs, category }: GigsClientProps) {
  const [page, setPage] = useState(1);
  const gigsPerPage = 10;
  const totalPages = Math.ceil(initialGigs.length / gigsPerPage);

  useEffect(() => {
    setPage(1); // Reset to first page when gigs change
  }, [initialGigs]);

  if (!initialGigs || initialGigs.length === 0) {
    return <div className="py-10 text-center text-zinc-500">No gigs found in this category.</div>;
  }

  const paginatedGigs = initialGigs.slice((page - 1) * gigsPerPage, page * gigsPerPage);

  return (
    <>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {paginatedGigs.map(gig => {
          return (
            <div
              key={gig.id}
              className="relative flex flex-col justify-between rounded-xl border border-zinc-200 bg-white p-6 shadow-lg transition-transform hover:-translate-y-1 hover:shadow-2xl dark:border-zinc-800 dark:bg-gradient-to-br dark:from-zinc-900 dark:to-zinc-800"
            >
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <Badge variant="secondary">{gig.source}</Badge>
                  {gig.category &&
                    gig.category.trim().toLowerCase() !== gig.source.trim().toLowerCase() && (
                      <Badge variant="outline">{gig.category}</Badge>
                    )}
                  {gig.tradeType &&
                    gig.tradeType.trim().toLowerCase() !== gig.category.trim().toLowerCase() &&
                    gig.tradeType.trim().toLowerCase() !== gig.source.trim().toLowerCase() && (
                      <Badge variant="success">{gig.tradeType}</Badge>
                    )}
                </div>
                <h2 className="mb-2 line-clamp-2 text-xl font-bold text-zinc-900 dark:text-zinc-100">
                  {gig.title}
                </h2>
                <div
                  className="prose mb-3 line-clamp-5 max-w-none text-sm text-zinc-700 dark:prose-invert dark:text-zinc-300"
                  dangerouslySetInnerHTML={{ __html: gig.description || 'No description.' }}
                />
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
                {gig.location && (
                  <span className="flex items-center gap-1">
                    <Icons.target className="h-4 w-4" />
                    {gig.location}
                  </span>
                )}
                {gig.createdAt && (
                  <span className="flex items-center gap-1">
                    <Icons.calendar className="h-4 w-4" />
                    {_formatDate(new Date(gig.createdAt))}
                  </span>
                )}
                {gig.payEstimate && (
                  <span className="flex items-center gap-1">
                    <Icons.dollarSign className="h-4 w-4" />
                    {gig.payEstimate}
                  </span>
                )}
              </div>
              <div className="mt-6 flex items-center justify-between">
                <Button
                  variant="default"
                  className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2 text-base font-semibold shadow transition-colors hover:bg-primary/90"
                  onClick={() => window.open(gig.url, '_blank', 'noopener,noreferrer')}
                  type="button"
                >
                  <Icons.arrowRight className="h-4 w-4" />
                  View Gig
                </Button>
              </div>
            </div>
          );
        })}
      </div>
      {totalPages > 1 && (
        <div className="mt-6 flex justify-center gap-4">
          <button
            className="px-4 py-2 rounded bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200 disabled:opacity-50"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </button>
          <span className="px-2 py-2 text-sm">
            Page {page} of {totalPages}
          </span>
          <button
            className="px-4 py-2 rounded bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200 disabled:opacity-50"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Next
          </button>
        </div>
      )}
    </>
  );
}
