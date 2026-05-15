'use client';

import React, { useEffect, useState } from 'react';
import { ThemeToggle } from '@/components/ui/theme-toggle';

interface Gig {
  id: string;
  title: string;
  description: string;
  url: string;
  source: string;
  category: string;
  postedAt?: string;
}

const _categories = [
  'Web Dev / Tech',
  'Marketing',
  'Copywriting',
  'Video Editing',
  'Photography',
  'Beauty',
  'Yard/Landscaping',
  'Mechanics',
  'Editing/Publishing',
  'Other Skilled Trades',
  'Other',
];

function getBookmarks(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem('bookmarkedGigs') || '[]');
  } catch {
    return [];
  }
}

function setBookmarks(ids: string[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('bookmarkedGigs', JSON.stringify(ids));
}

function Modal({ open, onClose, gig }: { open: boolean; onClose: () => void; gig: Gig | null }) {
  const [copied, setCopied] = useState(false);
  if (!open || !gig) return null;
  const handleCopy = () => {
    navigator.clipboard.writeText(
      `Title: ${gig.title}\nSource: ${gig.source}\nDescription: ${gig.description}`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-lg dark:bg-zinc-900">
        <button
          className="btn btn-xs btn-outline absolute right-2 top-2"
          onClick={onClose}
          aria-label="Close"
        >
          ✕
        </button>
        <h2 className="mb-2 text-xl font-bold">{gig.title}</h2>
        <div className="mb-2 text-xs text-zinc-500">{gig.source}</div>
        <div className="mb-4 whitespace-pre-line text-sm">{gig.description}</div>
        <button className="btn btn-primary w-full" onClick={handleCopy}>
          {copied ? 'Copied!' : 'Copy Details'}
        </button>
      </div>
    </div>
  );
}

export default function GigsHub() {
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [category, setCategory] = useState<string>('');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookmarked, setBookmarked] = useState<string[]>([]);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [modalGig, setModalGig] = useState<Gig | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    setBookmarked(getBookmarks());
  }, []);

  useEffect(() => {
    setBookmarks(bookmarked);
  }, [bookmarked]);

  useEffect(() => {
    if (showBookmarks) return;
    const fetchGigs = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: String(limit),
        });
        const res = await fetch(`/api/gigs?${params.toString()}`);
        if (!res.ok) throw new Error('Failed to fetch gigs');
        const data = await res.json();
        setGigs(data.gigs);
        setTotalPages(data.pagination?.pages || 1);
      } catch (err: any) {
        setError(err.message || 'Unknown error');
      } finally {
        setLoading(false);
      }
    };
    fetchGigs();
  }, [page, limit, showBookmarks]);

  // For debugging: log all gigs received from API
  useEffect(() => {
    console.log('Gigs from API:', gigs);
  }, [gigs]);

  // Always display all gigs for debugging (ignore bookmarks and category)
  const _displayedGigs = gigs;

  const _toggleBookmark = (id: string) => {
    setBookmarked(prev => (prev.includes(id) ? prev.filter(bid => bid !== id) : [...prev, id]));
  };

  const _handleApply = (gig: Gig) => {
    if (gig.url && gig.url.startsWith('http')) {
      window.open(gig.url, '_blank', 'noopener,noreferrer');
    } else {
      setModalGig(gig);
      setModalOpen(true);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-4">
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} gig={modalGig} />
      <div className="flex flex-col items-center justify-between gap-4 pb-4 pt-6 sm:flex-row">
        <h1 className="text-3xl font-bold">Gigs Hub</h1>
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <ThemeToggle />
          <div className="w-full sm:w-64">
            <label htmlFor="category-select" className="sr-only">
              Filter by category
            </label>
            <select
              id="category-select"
              className="select select-bordered w-full"
              value={category}
              onChange={e => {
                setCategory(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Categories</option>
              {_categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
          <button
            className={`btn btn-sm ml-2 ${showBookmarks ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setShowBookmarks(b => !b)}
            aria-pressed={!!showBookmarks}
          >
            {showBookmarks ? 'Show All' : 'Show Bookmarks'}
          </button>
        </div>
      </div>
      {loading ? (
        <div className="animate-pulse py-10 text-center text-lg">Loading gigs...</div>
      ) : error ? (
        <div className="py-10 text-center text-red-500">{error}</div>
      ) : _displayedGigs.length === 0 ? (
        <div className="py-10 text-center text-zinc-500">No gigs found.</div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {_displayedGigs.map(gig => (
            <div key={gig.id} className="relative">
              <a
                href={gig.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-lg border border-zinc-200 bg-white p-4 shadow transition hover:shadow-lg dark:border-zinc-700 dark:bg-zinc-800"
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400">
                    {gig.source || 'Unknown Source'}
                  </span>
                  {gig.postedAt && (
                    <span className="text-xs text-zinc-400">
                      {new Date(gig.postedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
                <h2 className="mb-1 line-clamp-2 text-lg font-bold">{gig.title}</h2>
                <p className="mb-2 line-clamp-3 text-sm text-zinc-600 dark:text-zinc-300">
                  {gig.description}
                </p>
                <span className="inline-block rounded bg-zinc-100 px-2 py-1 text-xs text-zinc-500 dark:bg-zinc-700 dark:text-zinc-300">
                  {gig.category || 'Other'}
                </span>
              </a>
              <button
                className={`btn btn-xs absolute right-3 top-3 rounded-full ${bookmarked.includes(gig.id) ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => _toggleBookmark(gig.id)}
                aria-label={bookmarked.includes(gig.id) ? 'Remove bookmark' : 'Add bookmark'}
                tabIndex={0}
              >
                {bookmarked.includes(gig.id) ? '★' : '☆'}
              </button>
              <button
                className="btn btn-xs btn-success absolute bottom-3 right-3"
                onClick={() => _handleApply(gig)}
                aria-label="Apply to gig"
                tabIndex={0}
              >
                Apply
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="mt-6 flex items-center justify-center gap-2">
        <button
          className="btn btn-sm btn-outline"
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1 || loading}
        >
          Previous
        </button>
        <span className="mx-2 text-sm">
          Page {page} of {totalPages}
        </span>
        <button
          className="btn btn-sm btn-outline"
          onClick={() => setPage(p => Math.min(totalPages, p + 1))}
          disabled={page === totalPages || loading}
        >
          Next
        </button>
      </div>
    </div>
  );
}
