import React from 'react';
import {
  useAggregatedGigs,
  useUserFavorites,
  useAddFavoriteGig,
  useRemoveFavoriteGig,
} from '@/lib/hooks/useAggregatedGigs';
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

function useLocalFavorites() {
  const [favorites, setFavorites] = useState<string[]>([]);
  useEffect(() => {
    const favs = localStorage.getItem('gigFavorites');
    setFavorites(favs ? JSON.parse(favs) : []);
  }, []);
  const toggleFavorite = (id: string) => {
    setFavorites(prev => {
      const next = prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id];
      localStorage.setItem('gigFavorites', JSON.stringify(next));
      return next;
    });
  };
  return { favorites, toggleFavorite };
}

const applicationSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  portfolio: z.string().url('Must be a valid URL').optional(),
  coverLetter: z.string().min(100, 'Cover letter must be at least 100 characters'),
  experience: z.string().min(50, 'Please describe your relevant experience'),
  availability: z.string().min(10, 'Please describe your availability'),
  rate: z.string().optional(),
  additionalInfo: z.string().optional(),
});

type ApplicationFormData = z.infer<typeof applicationSchema>;

export default function AggregatedGigsExplorer() {
  const { data: gigs, isLoading } = useAggregatedGigs();
  const [category, setCategory] = useState('all');
  const [tag, setTag] = useState('all');
  const [showFavs, setShowFavs] = useState(false);
  const { data: session, status } = useSession();
  const isLoggedIn = status === 'authenticated';

  // DB favorites for logged-in users
  const { data: dbFavorites = [], refetch } = useUserFavorites();
  const _addFavorite = useAddFavoriteGig();
  const _removeFavorite = useRemoveFavoriteGig();
  // Local favorites for guests
  const _localFavs = useLocalFavorites();

  const favorites = isLoggedIn ? dbFavorites : _localFavs.favorites;
  const toggleFavorite = (id: string) => {
    if (isLoggedIn) {
      if (favorites.includes(id)) {
        _removeFavorite.mutate(id, { onSuccess: refetch });
      } else {
        _addFavorite.mutate(id, { onSuccess: refetch });
      }
    } else {
      _localFavs.toggleFavorite(id);
    }
  };

  // Only show curated gigs
  const _curatedGigs = gigs?.filter(gig => gig.curated) || [];
  const _categories = Array.from(new Set(_curatedGigs.map(g => g.category)));
  const tags = Array.from(new Set(_curatedGigs.flatMap(g => g.tags)));
  const [minPay, setMinPay] = useState('');
  const [maxPay, setMaxPay] = useState('');
  const _locations = Array.from(new Set(_curatedGigs.map(g => g.location).filter(Boolean)));

  let filteredGigs = _curatedGigs.filter(
    gig =>
      (category === 'all' || gig.category === category) &&
      (tag === 'all' || gig.tags.includes(tag)) &&
      ((minPay === '' && maxPay === '') ||
        (() => {
          // Try to parse payEstimate as a number (strip $ and commas)
          if (!gig.payEstimate) return true;
          const pay = parseInt(gig.payEstimate.replace(/[^\d]/g, ''));
          if (minPay && pay < parseInt(minPay)) return false;
          if (maxPay && pay > parseInt(maxPay)) return false;
          return true;
        })()) &&
      (location === 'all' || gig.location === location)
  );
  if (showFavs) filteredGigs = filteredGigs.filter(gig => favorites.includes(gig.id));

  const [quickApplyGig, setQuickApplyGig] = useState<null | (typeof _curatedGigs)[0]>(null);
  const [location, setLocation] = useState('all');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ApplicationFormData>({
    resolver: zodResolver(applicationSchema),
  });

  const onSubmit = async (data: ApplicationFormData) => {
    if (!quickApplyGig) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const _res = await fetch('/api/aggregated-gigs/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gigId: quickApplyGig.id,
          applicationData: data,
        }),
      });

      if (!_res.ok) {
        const error = await _res.json();
        throw new Error(error.message || 'Failed to submit application');
      }

      setSubmitSuccess(true);
      reset();
      setTimeout(() => {
        setQuickApplyGig(null);
        setSubmitSuccess(false);
      }, 2000);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to submit application');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl p-4">
      <h1 className="mb-6 text-2xl font-bold dark:text-white">Featured Gigs</h1>
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <label htmlFor="category-filter" className="sr-only">
          Filter by category
        </label>
        <select
          id="category-filter"
          className="rounded border px-3 py-2 dark:bg-gray-900 dark:text-white"
          value={category}
          onChange={e => setCategory(e.target.value)}
        >
          <option value="all">All Categories</option>
          {_categories.map(cat => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
        <label htmlFor="tag-filter" className="sr-only">
          Filter by tag
        </label>
        <select
          id="tag-filter"
          className="rounded border px-3 py-2 dark:bg-gray-900 dark:text-white"
          value={tag}
          onChange={e => setTag(e.target.value)}
        >
          <option value="all">All Tags</option>
          {tags.map(t => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <label htmlFor="location-filter" className="sr-only">
          Filter by location
        </label>
        <select
          id="location-filter"
          className="rounded border px-3 py-2 dark:bg-gray-900 dark:text-white"
          value={location}
          onChange={e => setLocation(e.target.value)}
        >
          <option value="all">All Locations</option>
          {_locations.map(loc => (
            <option key={loc} value={loc}>
              {loc}
            </option>
          ))}
        </select>
        <label htmlFor="min-pay" className="sr-only">
          Min pay
        </label>
        <input
          id="min-pay"
          type="number"
          placeholder="Min pay"
          className="w-24 rounded border px-3 py-2 dark:bg-gray-900 dark:text-white"
          value={minPay}
          onChange={e => setMinPay(e.target.value)}
        />
        <label htmlFor="max-pay" className="sr-only">
          Max pay
        </label>
        <input
          id="max-pay"
          type="number"
          placeholder="Max pay"
          className="w-24 rounded border px-3 py-2 dark:bg-gray-900 dark:text-white"
          value={maxPay}
          onChange={e => setMaxPay(e.target.value)}
        />
        <button
          className={`ml-2 rounded border px-3 py-2 ${showFavs ? 'bg-primary text-white' : 'bg-white text-primary dark:bg-gray-900'} transition`}
          onClick={() => setShowFavs(v => !v)}
          aria-label="Show favorites"
        >
          {showFavs ? '★ Favorites' : '☆ Favorites'}
        </button>
      </div>
      {isLoading ? (
        <div className="py-8 text-center text-muted-foreground">Loading gigs...</div>
      ) : filteredGigs.length === 0 ? (
        <div className="py-8 text-center text-muted-foreground">No gigs found.</div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredGigs.map(gig => (
            <div
              key={gig.id}
              className="flex flex-col rounded-lg bg-white p-6 shadow dark:bg-gray-900"
            >
              <div className="mb-2 flex items-center justify-between">
                <div className="text-lg font-semibold dark:text-white">{gig.title}</div>
                <button
                  className="ml-2 text-xl"
                  aria-label={favorites.includes(gig.id) ? 'Unsave' : 'Save'}
                  onClick={() => toggleFavorite(gig.id)}
                >
                  {favorites.includes(gig.id) ? '★' : '☆'}
                </button>
              </div>
              <div className="mb-2 text-sm text-gray-500 dark:text-gray-400">{gig.category}</div>
              <div className="mb-2 flex flex-wrap gap-1">
                {gig.tags.map(tag => (
                  <span
                    key={tag}
                    className="inline-block rounded bg-blue-100 px-2 py-1 text-xs text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <div className="mb-4 line-clamp-3 flex-1 text-gray-700 dark:text-gray-300">
                {gig.description}
              </div>
              <div className="mt-auto flex gap-2">
                {gig.internalApplication ? (
                  <button
                    className="hover:bg-primary-dark inline-block rounded bg-primary px-4 py-2 font-semibold text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    onClick={() => setQuickApplyGig(gig)}
                  >
                    Quick Apply
                  </button>
                ) : (
                  <a
                    href={gig.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:bg-primary-dark inline-block rounded bg-primary px-4 py-2 font-semibold text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    Apply
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      {/* Quick Apply Modal */}
      <Dialog
        open={!!quickApplyGig}
        onClose={() => {
          if (!isSubmitting) {
            setQuickApplyGig(null);
            reset();
            setSubmitError(null);
            setSubmitSuccess(false);
          }
        }}
        className="fixed inset-0 z-50 overflow-y-auto"
      >
        <div className="flex min-h-screen items-center justify-center px-4">
          <Dialog.Overlay className="fixed inset-0 bg-black bg-opacity-50" />
          <div className="relative z-10 mx-auto w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl dark:bg-gray-900">
            <Dialog.Title className="mb-4 text-xl font-bold dark:text-white">
              Quick Apply: {quickApplyGig?.title}
            </Dialog.Title>

            {submitSuccess ? (
              <div className="py-4 text-center text-green-600 dark:text-green-400">
                Application submitted successfully!
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Name *
                    </label>
                    <input
                      {...register('name')}
                      className="w-full rounded border px-3 py-2 dark:bg-gray-800 dark:text-white"
                      placeholder="Your full name"
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Email *
                    </label>
                    <input
                      {...register('email')}
                      type="email"
                      className="w-full rounded border px-3 py-2 dark:bg-gray-800 dark:text-white"
                      placeholder="your@email.com"
                    />
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Phone
                    </label>
                    <input
                      {...register('phone')}
                      type="tel"
                      className="w-full rounded border px-3 py-2 dark:bg-gray-800 dark:text-white"
                      placeholder="+1 (555) 555-5555"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Portfolio URL
                    </label>
                    <input
                      {...register('portfolio')}
                      type="url"
                      className="w-full rounded border px-3 py-2 dark:bg-gray-800 dark:text-white"
                      placeholder="https://your-portfolio.com"
                    />
                    {errors.portfolio && (
                      <p className="mt-1 text-sm text-red-500">{errors.portfolio.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Cover Letter *
                  </label>
                  <textarea
                    {...register('coverLetter')}
                    className="w-full rounded border px-3 py-2 dark:bg-gray-800 dark:text-white"
                    rows={4}
                    placeholder="Tell us why you're interested in this position..."
                  />
                  {errors.coverLetter && (
                    <p className="mt-1 text-sm text-red-500">{errors.coverLetter.message}</p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Relevant Experience *
                  </label>
                  <textarea
                    {...register('experience')}
                    className="w-full rounded border px-3 py-2 dark:bg-gray-800 dark:text-white"
                    rows={3}
                    placeholder="Describe your relevant experience..."
                  />
                  {errors.experience && (
                    <p className="mt-1 text-sm text-red-500">{errors.experience.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Availability *
                    </label>
                    <input
                      {...register('availability')}
                      className="w-full rounded border px-3 py-2 dark:bg-gray-800 dark:text-white"
                      placeholder="e.g., Immediate, 2 weeks notice"
                    />
                    {errors.availability && (
                      <p className="mt-1 text-sm text-red-500">{errors.availability.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Expected Rate (optional)
                    </label>
                    <input
                      {...register('rate')}
                      className="w-full rounded border px-3 py-2 dark:bg-gray-800 dark:text-white"
                      placeholder="e.g., $50/hour"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Additional Information
                  </label>
                  <textarea
                    {...register('additionalInfo')}
                    className="w-full rounded border px-3 py-2 dark:bg-gray-800 dark:text-white"
                    rows={2}
                    placeholder="Any additional information you'd like to share..."
                  />
                </div>

                {submitError && <div className="mt-2 text-sm text-red-500">{submitError}</div>}

                <div className="mt-4 flex gap-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="hover:bg-primary-dark flex-1 rounded bg-primary px-4 py-2 font-semibold text-white focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Application'}
                  </button>
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => {
                      setQuickApplyGig(null);
                      reset();
                      setSubmitError(null);
                    }}
                    className="px-4 py-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 dark:text-gray-300 dark:hover:text-gray-100"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </Dialog>
    </div>
  );
}
