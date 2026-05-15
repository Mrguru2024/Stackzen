import 'server-only';

import { Redis } from '@upstash/redis';

function isUpstashConfigured(): boolean {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim() ?? '';
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim() ?? '';
  return url.startsWith('https://') && token.length > 0;
}

/** Null when Upstash env vars are missing or still set to placeholders (local dev). */
export const redis: Redis | null = isUpstashConfigured()
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;

/** After a network/DNS failure, skip Redis for the rest of the process (fail open, quiet logs). */
let redisCircuitOpen = false;

function isUnreachableRedisError(error: unknown): boolean {
  const msg =
    error instanceof Error ? error.message : typeof error === 'string' ? error : '';
  const cause = error instanceof Error && error.cause instanceof Error ? error.cause : null;
  const causeMsg = cause?.message ?? '';
  const combined = `${msg} ${causeMsg}`.toLowerCase();
  return (
    combined.includes('enotfound') ||
    combined.includes('fetch failed') ||
    combined.includes('econnrefused') ||
    combined.includes('etimedout')
  );
}

function tripCircuitOnce(error: unknown): void {
  if (redisCircuitOpen) return;
  redisCircuitOpen = true;
  const hint =
    'Upstash Redis is unreachable (wrong URL, deleted database, or offline). ' +
    'Rate limiting is disabled until restart. Fix UPSTASH_REDIS_REST_URL / TOKEN or unset both for local dev.';
  if (process.env.NODE_ENV === 'development') {
    console.warn(`[redis-edge] ${hint}`, error instanceof Error ? error.message : error);
  } else {
    console.warn(`[redis-edge] ${hint}`);
  }
}

// Helper functions for common Redis operations
export const _RedisEdge = {
  async get(key: string): Promise<string | null> {
    if (!redis || redisCircuitOpen) return null;
    try {
      return await redis.get(key);
    } catch (error) {
      if (isUnreachableRedisError(error)) tripCircuitOnce(error);
      else console.error('Redis get error:', error);
      return null;
    }
  },

  async set(key: string, value: string, expirySeconds?: number): Promise<void> {
    if (!redis || redisCircuitOpen) return;
    try {
      if (expirySeconds) {
        await redis.set(key, value, { ex: expirySeconds });
      } else {
        await redis.set(key, value);
      }
    } catch (error) {
      if (isUnreachableRedisError(error)) tripCircuitOnce(error);
      else console.error('Redis set error:', error);
    }
  },

  async del(key: string): Promise<void> {
    if (!redis || redisCircuitOpen) return;
    try {
      await redis.del(key);
    } catch (error) {
      if (isUnreachableRedisError(error)) tripCircuitOnce(error);
      else console.error('Redis del error:', error);
    }
  },

  async incr(key: string): Promise<number> {
    if (!redis || redisCircuitOpen) return 0;
    try {
      return await redis.incr(key);
    } catch (error) {
      if (isUnreachableRedisError(error)) tripCircuitOnce(error);
      else console.error('Redis incr error:', error);
      return 0;
    }
  },

  async expire(key: string, seconds: number): Promise<void> {
    if (!redis || redisCircuitOpen) return;
    try {
      await redis.expire(key, seconds);
    } catch (error) {
      if (isUnreachableRedisError(error)) tripCircuitOnce(error);
      else console.error('Redis expire error:', error);
    }
  },
};

export const RedisEdge = _RedisEdge;
