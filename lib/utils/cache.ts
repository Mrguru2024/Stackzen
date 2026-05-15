import { _AggregatedGig } from '@/types/gig';
import { getRecentGigsFromDb } from '@/lib/aggregation/gig-sources';

// Simple in-memory cache implementation
class Cache {
  private store: Map<string, { value: any; expiry: number }>;

  constructor() {
    this.store = new Map();
  }

  get(key: string): any {
    const _item = this.store.get(key);
    if (!_item) return null;
    if (_item.expiry < Date.now()) {
      this.store.delete(key);
      return null;
    }
    return _item.value;
  }

  set(key: string, value: any, ttl: number): void {
    this.store.set(key, {
      value,
      expiry: Date.now() + ttl,
    });
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }
}

export const cache = new Cache();

// Get cached gigs with fallback
export async function getCachedGigs(category: string) {
  // Fetch from DB, filter by category
  const gigs = await getRecentGigsFromDb(100);
  return gigs.filter(gig => gig.category === category);
}

// Get cached categories
export async function getCachedCategories(): Promise<string[]> {
  const _cacheKey = 'categories';
  const cached = cache.get(_cacheKey);
  if (cached) {
    return cached as string[];
  }

  try {
    const { gigSourceMap } = await import('@/lib/aggregation/gig-sources');
    const categories = Object.keys(gigSourceMap);
    cache.set(_cacheKey, categories, 60 * 60 * 1000); // Cache for 1 hour
    return categories;
  } catch (error) {
    console.error('Error fetching categories:', error);
    return Object.keys(FALLBACK_GIGS);
  }
}
