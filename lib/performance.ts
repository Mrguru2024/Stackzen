import { prisma } from './prisma.ts';
import { createRedisClient, withRedisFallback } from '@/lib/redis-client';

const redis = createRedisClient(process.env.REDIS_URL);

export class PerformanceOptimizer {
  private static instance: PerformanceOptimizer;

  private constructor() {}

  static getInstance(): PerformanceOptimizer {
    if (!PerformanceOptimizer.instance) {
      PerformanceOptimizer.instance = new PerformanceOptimizer();
    }
    return PerformanceOptimizer.instance;
  }

  // Database query optimization
  async optimizeQuery(query: string, params: any[]): Promise<any> {
    const cacheKey = `query:${query}:${JSON.stringify(params)}`;

    // Try to get from cache first
    const cached = await withRedisFallback(() => redis.get(cacheKey), null);
    if (cached) {
      return JSON.parse(cached);
    }

    // Execute query with optimized settings
    const result = await prisma.$queryRawUnsafe(query, ...params);

    // Cache the result
    await withRedisFallback(() => redis.set(cacheKey, JSON.stringify(result), 'EX', 300), 'OK'); // 5 minutes cache

    return result;
  }

  // Component memoization helper
  static memoize<T extends (..._args: any[]) => any>(
    fn: T,
    keyFn: (..._args: Parameters<T>) => string
  ): T {
    const cache = new Map<string, ReturnType<T>>();

    return ((..._args: Parameters<T>) => {
      const key = keyFn(..._args);
      if (cache.has(key)) {
        return cache.get(key);
      }

      const result = fn(..._args);
      cache.set(key, result);
      return result;
    }) as T;
  }

  // Image optimization
  async optimizeImage(
    imageUrl: string,
    options: {
      width?: number;
      height?: number;
      quality?: number;
    }
  ): Promise<string> {
    const cdnService = (await import('./cdn')).CDNService.getInstance();
    return cdnService.optimizeImage(imageUrl, options);
  }

  // API response caching
  async cacheApiResponse(key: string, data: any, ttl: number = 300): Promise<void> {
    await withRedisFallback(() => redis.set(key, JSON.stringify(data), 'EX', ttl), 'OK');
  }

  async getCachedApiResponse(key: string): Promise<any | null> {
    const cached = await withRedisFallback(() => redis.get(key), null);
    return cached ? JSON.parse(cached) : null;
  }

  // Database connection pooling
  static async getOptimizedConnection() {
    return prisma.$connect();
  }

  // Resource preloading
  static preloadResources(resources: string[]): void {
    resources.forEach(resource => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = resource.endsWith('.js') ? 'script' : 'style';
      link.href = resource;
      document.head.appendChild(link);
    });
  }
}
