import Redis from 'ioredis';
import { createRedisClient } from '@/lib/redis-client';

// Redis client configuration
const redisClient = createRedisClient();

// Cache configuration
const CACHE_TTL = {
  SHORT: 300, // 5 minutes
  MEDIUM: 1800, // 30 minutes
  LONG: 3600, // 1 hour
  VERY_LONG: 86400, // 24 hours
};

// Cache utility functions
export class CacheService {
  private static instance: CacheService;
  private readonly redis: Redis;

  private constructor() {
    this.redis = redisClient;
  }

  public static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  // Set cache with TTL
  async set(key: string, value: unknown, ttl: number = CACHE_TTL.MEDIUM): Promise<void> {
    try {
      const serializedValue = JSON.stringify(value);
      await this.redis.setex(key, ttl, serializedValue);
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  // Get cache value
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  // Delete cache key
  async delete(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }

  // Delete multiple cache keys by pattern
  async deletePattern(pattern: string): Promise<void> {
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (error) {
      console.error('Cache delete pattern error:', error);
    }
  }

  // Check if key exists
  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.redis.exists(key);
      return result === 1;
    } catch (error) {
      console.error('Cache exists error:', error);
      return false;
    }
  }

  // Get cache with fallback
  async getOrSet<T>(
    key: string,
    fallback: () => Promise<T>,
    ttl: number = CACHE_TTL.MEDIUM
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const fresh = await fallback();
    await this.set(key, fresh, ttl);
    return fresh;
  }

  // Clear all cache
  async clear(): Promise<void> {
    try {
      await this.redis.flushall();
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  }

  // Get cache statistics
  async getStats(): Promise<{ keys: number; memory: string }> {
    try {
      const keys = await this.redis.dbsize();
      const info = await this.redis.info('memory');
      const memoryMatch = /used_memory_human:(\S+)/.exec(info);
      const memory = memoryMatch ? memoryMatch[1] : 'unknown';

      return { keys, memory };
    } catch (error) {
      console.error('Cache stats error:', error);
      return { keys: 0, memory: 'unknown' };
    }
  }
}

// Cache key generators
export const cacheKeys = {
  user: (userId: string) => `user:${userId}`,
  userSettings: (userId: string) => `user_settings:${userId}`,
  incomeSummary: (userId: string, period: string) => `income_summary:${userId}:${period}`,
  expenses: (userId: string, period: string) => `expenses:${userId}:${period}`,
  services: (userId: string) => `services:${userId}`,
  bookings: (userId: string, status?: string) =>
    status ? `bookings:${userId}:${status}` : `bookings:${userId}`,
  invoices: (userId: string, status?: string) =>
    status ? `invoices:${userId}:${status}` : `invoices:${userId}`,
  goals: (userId: string) => `goals:${userId}`,
  challenges: (userId: string) => `challenges:${userId}`,
  investments: (userId: string) => `investments:${userId}`,
  cards: (userId: string, type?: string) => (type ? `cards:${userId}:${type}` : `cards:${userId}`),
  savings: (userId: string) => `savings:${userId}`,
  budgetAllocations: (userId: string, period: string) => `budget:${userId}:${period}`,
  gigApplications: (userId: string, status?: string) =>
    status ? `gigs:${userId}:${status}` : `gigs:${userId}`,
};

// Cache decorator for API routes
export function withCache(ttl: number = CACHE_TTL.MEDIUM) {
  return function (target: unknown, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: unknown[]) {
      const cacheService = CacheService.getInstance();
      const cacheKey = `${(target as { constructor: { name: string } }).constructor.name}:${propertyName}:${JSON.stringify(args)}`;

      return cacheService.getOrSet(cacheKey, () => method.apply(this, args), ttl);
    };
  };
}

// Export cache instance
export const cache = CacheService.getInstance();
export { CACHE_TTL };
