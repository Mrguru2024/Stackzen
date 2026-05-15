import { LRUCache } from 'lru-cache';
import { createRedisClient, withRedisFallback } from '@/lib/redis-client';

// Redis client for distributed caching
const redis = createRedisClient(process.env.REDIS_URL || 'redis://localhost:6379');

// In-memory LRU cache for local caching
const lruCache = new LRUCache({
  max: 500, // Maximum number of items
  ttl: 1000 * 60 * 5, // 5 minutes TTL
});

// Cache keys
const CACHE_KEYS = {
  DASHBOARD: (userId: string) => `dashboard:${userId}`,
  CALENDAR: (userId: string) => `calendar:${userId}`,
  QUOTE: (quoteId: string) => `quote:${quoteId}`,
  AI_CONTEXT: (userId: string) => `ai:context:${userId}`,
} as const;

// Cache options
const CACHE_OPTIONS = {
  DASHBOARD: { ttl: 60 }, // 1 minute
  CALENDAR: { ttl: 300 }, // 5 minutes
  QUOTE: { ttl: 3600 }, // 1 hour
  AI_CONTEXT: { ttl: 1800 }, // 30 minutes
} as const;

// Cache interface
interface CacheOptions {
  ttl: number;
  useLocalCache?: boolean;
}

// Cache service
export class CacheService {
  // Get data from cache
  static async get<T>(key: string, options: CacheOptions): Promise<T | null> {
    // Try local cache first if enabled
    if (options.useLocalCache) {
      const localData = lruCache.get(key);
      if (localData) return localData as T;
    }

    // Try Redis cache
    const data = await withRedisFallback(() => redis.get(key), null);
    if (!data) return null;

    const parsedData = JSON.parse(data);

    // Update local cache if enabled
    if (options.useLocalCache) {
      lruCache.set(key, parsedData);
    }

    return parsedData as T;
  }

  // Set data in cache
  static async set(key: string, data: any, options: CacheOptions): Promise<void> {
    const serializedData = JSON.stringify(data);

    // Set in Redis
    await withRedisFallback(() => redis.set(key, serializedData, 'EX', options.ttl), 'OK');

    // Set in local cache if enabled
    if (options.useLocalCache) {
      lruCache.set(key, data);
    }
  }

  // Delete data from cache
  static async delete(key: string): Promise<void> {
    await withRedisFallback(() => redis.del(key), 0);
    lruCache.delete(key);
  }

  // Clear all cache
  static async clear(): Promise<void> {
    await withRedisFallback(() => redis.flushall(), 'OK');
    lruCache.clear();
  }

  // Get dashboard data with caching
  static async getDashboardData(userId: string): Promise<any> {
    const cacheKey = CACHE_KEYS.DASHBOARD(userId);
    const cachedData = await this.get(cacheKey, CACHE_OPTIONS.DASHBOARD);

    if (cachedData) {
      return cachedData;
    }

    // Fetch fresh data
    const data = await fetchDashboardData(userId);
    await this.set(cacheKey, data, CACHE_OPTIONS.DASHBOARD);
    return data;
  }

  // Get calendar data with caching
  static async getCalendarData(userId: string): Promise<any> {
    const cacheKey = CACHE_KEYS.CALENDAR(userId);
    const cachedData = await this.get(cacheKey, CACHE_OPTIONS.CALENDAR);

    if (cachedData) {
      return cachedData;
    }

    // Fetch fresh data
    const data = await fetchCalendarData(userId);
    await this.set(cacheKey, data, CACHE_OPTIONS.CALENDAR);
    return data;
  }

  // Get quote data with caching
  static async getQuoteData(quoteId: string): Promise<any> {
    const cacheKey = CACHE_KEYS.QUOTE(quoteId);
    const cachedData = await this.get(cacheKey, CACHE_OPTIONS.QUOTE);

    if (cachedData) {
      return cachedData;
    }

    // Fetch fresh data
    const data = await fetchQuoteData(quoteId);
    await this.set(cacheKey, data, CACHE_OPTIONS.QUOTE);
    return data;
  }

  // Get AI context with caching
  static async getAIContext(userId: string): Promise<any> {
    const cacheKey = CACHE_KEYS.AI_CONTEXT(userId);
    const cachedData = await this.get(cacheKey, CACHE_OPTIONS.AI_CONTEXT);

    if (cachedData) {
      return cachedData;
    }

    // Fetch fresh data
    const data = await fetchAIContext(userId);
    await this.set(cacheKey, data, CACHE_OPTIONS.AI_CONTEXT);
    return data;
  }
}

// Helper functions to fetch data (implement these based on your data sources)
async function fetchDashboardData(userId: string) {
  // Implement dashboard data fetching
  return {};
}

async function fetchCalendarData(userId: string) {
  // Implement calendar data fetching
  return {};
}

async function fetchQuoteData(quoteId: string) {
  // Implement quote data fetching
  return {};
}

async function fetchAIContext(userId: string) {
  // Implement AI context fetching
  return {};
}

export default CacheService;
