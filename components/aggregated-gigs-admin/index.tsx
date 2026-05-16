import React from 'react';
import {
  useAggregatedGigs,
  useCurateGig,
  useDeleteGig,
  AggregatedGig,
} from '@/lib/hooks/useAggregatedGigs';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui';
import { useState } from 'react';

export default function AggregatedGigsAdmin() {
  const { data: session } = useSession();
  const { data: gigs, isLoading } = useAggregatedGigs();
  const curateGig = useCurateGig();
  const deleteGig = useDeleteGig();
  const role = session?.user?.role;
  const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN';
  const [filter, setFilter] = useState('all');

  const filteredGigs = gigs?.filter(gig => (filter === 'all' ? true : gig.category === filter));

  const categories = Array.from(new Set(gigs?.map(g => g.category) || []));
  const _sources = Array.from(new Set(gigs?.map(g => g.source) || []));

  // Build summary matrix: source x category
  const summary: Record<string, Record<string, number>> = {};
  _sources.forEach(source => {
    summary[source] = {};
    categories.forEach(cat => {
      summary[source][cat] = gigs?.filter(g => g.source === source && g.category === cat).length || 0;
    });
  });
  // Totals
  const totalPerSource = Object.fromEntries(
    _sources.map(source => [source, categories.reduce((sum, cat) => sum + summary[source][cat], 0)])
  );
  const totalPerCategory = Object.fromEntries(
    categories.map(cat => [cat, _sources.reduce((sum, source) => sum + summary[source][cat], 0)])
  );
  const grandTotal = gigs?.length || 0;

  return (
    <div className="mx-auto max-w-5xl p-4">
      {/* Summary Table */}
      <div className="mb-8 overflow-x-auto rounded-lg border border-gray-200 bg-white shadow dark:border-gray-800 dark:bg-gray-900">
        <h2 className="p-4 text-lg font-semibold dark:text-white">Job Source/Category Summary</h2>
        <table className="min-w-full text-sm">
          <thead>
            <tr>
              <th className="p-2 text-left font-bold">Source</th>
              {categories.map(cat => (
                <th key={cat} className="p-2 text-left font-bold">{cat}</th>
              ))}
              <th className="p-2 text-left font-bold">Total</th>
            </tr>
          </thead>
          <tbody>
            {_sources.map(source => (
              <tr key={source} className="border-t border-gray-100 dark:border-gray-800">
                <td className="p-2 font-medium dark:text-white">{source}</td>
                {categories.map(cat => (
                  <td key={cat} className="p-2 text-gray-700 dark:text-gray-300">{summary[source][cat]}</td>
                ))}
                <td className="p-2 font-bold text-gray-900 dark:text-white">{totalPerSource[source]}</td>
              </tr>
            ))}
            {/* Total row */}
            <tr className="border-t border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              <td className="p-2 font-bold text-gray-900 dark:text-white">Total</td>
              {categories.map(cat => (
                <td key={cat} className="p-2 font-bold text-gray-900 dark:text-white">{totalPerCategory[cat]}</td>
              ))}
              <td className="p-2 font-bold text-primary">{grandTotal}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-bold dark:text-white">Aggregated Gigs Admin</h1>
        <label htmlFor="category-filter" className="sr-only">
          Filter by category
        </label>
        <select
          id="category-filter"
          className="rounded border px-3 py-2 dark:bg-gray-900 dark:text-white"
          value={filter}
          onChange={e => setFilter(e.target.value)}
        >
          <option value="all">All Categories</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>
      {!isAdmin && (
        <div className="mb-4 rounded bg-yellow-100 p-3 text-center text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
          Only admins can curate or delete gigs.
        </div>
      )}
      {isLoading ? (
        <div className="py-8 text-center text-muted-foreground">Loading gigs...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full rounded-lg bg-white shadow dark:bg-gray-900">
            <thead>
              <tr className="border-b border-gray-200 text-left dark:border-gray-700">
                <th className="p-3">Title</th>
                <th className="p-3">Category</th>
                <th className="p-3">Source</th>
                <th className="p-3">Tags</th>
                <th className="p-3">Featured</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredGigs?.map(gig => (
                <tr
                  key={gig.id}
                  className="border-b border-gray-100 transition hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800"
                >
                  <td className="max-w-xs truncate p-3 font-medium" title={gig.title}>
                    {gig.title}
                  </td>
                  <td className="p-3">{gig.category}</td>
                  <td className="p-3">{gig.source}</td>
                  <td className="p-3">
                    {gig.tags.map(tag => (
                      <span
                        key={tag}
                        className="mr-1 inline-block rounded bg-blue-100 px-2 py-1 text-xs text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                      >
                        {tag}
                      </span>
                    ))}
                  </td>
                  <td className="p-3">
                    <input
                      type="checkbox"
                      checked={gig.curated}
                      disabled={!isAdmin}
                      onChange={() =>
                        isAdmin && curateGig.mutate({ id: gig.id, curated: !gig.curated })
                      }
                      aria-label="Toggle featured"
                    />
                  </td>
                  <td className="flex gap-2 p-3">
                    <a
                      href={gig.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline dark:text-blue-300"
                    >
                      View
                    </a>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteGig.mutate(gig.id)}
                      disabled={!isAdmin}
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
