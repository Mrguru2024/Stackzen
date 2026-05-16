import type { PrismaClient } from '@prisma/client';
import { LRUCache } from 'lru-cache';
import { prisma } from '@/lib/prisma';
import { createRedisClient, withRedisFallback } from '@/lib/redis-client';

const redis = createRedisClient(process.env.REDIS_URL || 'redis://localhost:6379');

const CACHE_TTL = 5 * 60; // 5 minutes
const localCache = new LRUCache<string, any>({
  max: 1000,
  ttl: CACHE_TTL * 1000,
});

export class QueryOptimizer {
  // Execute query with caching
  static async executeQuery<T>(
    key: string,
    query: () => Promise<T>,
    options: {
      ttl?: number;
      tags?: string[];
      skipCache?: boolean;
    } = {}
  ): Promise<T> {
    const { ttl = CACHE_TTL, tags = [], skipCache = false } = options;

    if (skipCache) {
      return query();
    }

    // Try local cache first
    const cachedResult = localCache.get(key);
    if (cachedResult) {
      return cachedResult as T;
    }

    const redisCached = await withRedisFallback(() => redis.get(key), null);
    if (redisCached) {
      const parsed = JSON.parse(redisCached);
      localCache.set(key, parsed);
      return parsed as T;
    }

    const result = await query();

    localCache.set(key, result);
    await withRedisFallback(() => redis.set(key, JSON.stringify(result), 'EX', ttl), 'OK');

    // Store cache tags
    if (tags.length > 0) {
      await this.storeCacheTags(key, tags);
    }

    return result;
  }

  // Invalidate cache by tags
  static async invalidateCacheByTags(tags: string[]): Promise<void> {
    for (const tag of tags) {
      const keys = await this.getKeysByTag(tag);
      await Promise.all([
        ...keys.map(key => withRedisFallback(() => redis.del(key), 0)),
        ...keys.map(key => localCache.delete(key)),
      ]);
    }
  }

  // Store cache tags
  private static async storeCacheTags(key: string, tags: string[]): Promise<void> {
    await Promise.all(tags.map(tag => withRedisFallback(() => redis.sadd(`tag:${tag}`, key), 0)));
  }

  // Get keys by tag
  private static async getKeysByTag(tag: string): Promise<string[]> {
    return withRedisFallback(() => redis.smembers(`tag:${tag}`), []);
  }

  // Optimized dashboard data query
  static async getDashboardData(userId: string) {
    return this.executeQuery(
      `dashboard:${userId}`,
      async () => {
        const [income, expenses, quotes] = await Promise.all([
          prisma.income.findMany({
            where: { userId },
            orderBy: { date: 'desc' },
            take: 10,
          }),
          prisma.expense.findMany({
            where: { userId },
            orderBy: { date: 'desc' },
            take: 10,
          }),
          prisma.quote.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 5,
          }),
        ]);

        return {
          income,
          expenses,
          quotes,
        };
      },
      {
        tags: [`user:${userId}`, 'dashboard'],
        ttl: 60, // 1 minute
      }
    );
  }

  // Optimized calendar data query
  static async getCalendarData(userId: string, startDate: Date, endDate: Date) {
    return this.executeQuery(
      `calendar:${userId}:${startDate.toISOString()}:${endDate.toISOString()}`,
      async () => {
        const bills = await prisma.recurringBill.findMany({
          where: {
            userId,
            nextDueDate: {
              gte: startDate,
              lte: endDate,
            },
          },
        });

        return {
          bills,
          reminders: [] as const,
        };
      },
      {
        tags: [`user:${userId}`, 'calendar'],
        ttl: 300, // 5 minutes
      }
    );
  }

  // Optimized quote data query
  static async getQuoteData(userId: string, quoteId: string) {
    return this.executeQuery(
      `quote:${userId}:${quoteId}`,
      async () => {
        const quote = await prisma.quote.findUnique({
          where: { id: quoteId },
        });

        if (!quote) {
          throw new Error('Quote not found');
        }

        return quote;
      },
      {
        tags: [`user:${userId}`, `quote:${quoteId}`],
        ttl: 3600, // 1 hour
      }
    );
  }

  // Batch update multiple records
  static async batchUpdate<T extends { id: string }>(
    model: string,
    updates: Array<{ id: string; data: Partial<T> }>
  ): Promise<T[]> {
    const results: T[] = [];

    // Process in batches of 100
    for (let i = 0; i < updates.length; i += 100) {
      const batch = updates.slice(i, i + 100);
      const batchResults = await Promise.all(
        batch.map(({ id, data }) =>
          (prisma[model as keyof PrismaClient] as any).update({
            where: { id },
            data,
          })
        )
      );
      results.push(...batchResults);
    }

    // Invalidate related caches
    await this.invalidateCacheByTags([model]);

    return results;
  }

  // Batch create multiple records
  static async batchCreate<T>(model: string, data: Array<Omit<T, 'id'>>): Promise<T[]> {
    const results: T[] = [];

    // Process in batches of 100
    for (let i = 0; i < data.length; i += 100) {
      const batch = data.slice(i, i + 100);
      await (prisma[model as keyof PrismaClient] as any).createMany({
        data: batch,
      });
    }

    // Invalidate related caches
    await this.invalidateCacheByTags([model]);

    return results;
  }
}

export default QueryOptimizer;
