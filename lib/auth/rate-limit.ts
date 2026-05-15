import { _RedisEdge } from '../redis-edge';

interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
  blockDuration: number;
}

const _isDev = process.env.NODE_ENV !== 'production';
const defaultConfig: RateLimitConfig = _isDev
  ? { maxAttempts: 10000, windowMs: 1000, blockDuration: 60 * 1000 } // 10,000 attempts per second, 1 min block in dev
  : { maxAttempts: 5, windowMs: 15 * 60 * 1000, blockDuration: 60 * 60 * 1000 };

export class RateLimiter {
  private static instance: RateLimiter;
  private config: RateLimitConfig;

  private constructor(config: Partial<RateLimitConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  static getInstance(config?: Partial<RateLimitConfig>): RateLimiter {
    if (!RateLimiter.instance) {
      RateLimiter.instance = new RateLimiter(config);
    }
    return RateLimiter.instance;
  }

  private getKey(type: string, identifier: string): string {
    return `ratelimit:${type}:${identifier}`;
  }

  private getBlockKey(type: string, identifier: string): string {
    return `block:${type}:${identifier}`;
  }

  async checkLimit(
    type: string,
    identifier: string
  ): Promise<{
    allowed: boolean;
    remaining: number;
    reset: number;
    blocked: boolean;
    blockExpires?: number;
  }> {
    const _key = this.getKey(type, identifier);
    const _blockKey = this.getBlockKey(type, identifier);

    // Check if blocked
    const blockExpiresStr = await _RedisEdge.get(_blockKey);
    if (blockExpiresStr) {
      return {
        allowed: false,
        remaining: 0,
        reset: 0,
        blocked: true,
        blockExpires: parseInt(blockExpiresStr, 10),
      };
    }

    // Get current attempts
    let attempts = 0;
    const attemptsStr = await _RedisEdge.get(_key);
    if (attemptsStr) {
      attempts = parseInt(attemptsStr, 10);
    }
    attempts = (await _RedisEdge.incr(_key)) || 1;
    if (attempts === 1) {
      await _RedisEdge.expire(_key, this.config.windowMs / 1000);
    }

    const remaining = Math.max(0, this.config.maxAttempts - attempts);
    const reset = 0; // Upstash does not support TTL fetch in Edge, so set to 0 or implement if needed

    // Block if exceeded
    if (attempts > this.config.maxAttempts) {
      const blockUntil = Date.now() + this.config.blockDuration;
      await _RedisEdge.set(_blockKey, blockUntil.toString(), this.config.blockDuration / 1000);
      return {
        allowed: false,
        remaining: 0,
        reset: 0,
        blocked: true,
        blockExpires: blockUntil,
      };
    }

    return {
      allowed: attempts <= this.config.maxAttempts,
      remaining,
      reset,
      blocked: false,
    };
  }

  async resetLimit(type: string, identifier: string): Promise<void> {
    const _key = this.getKey(type, identifier);
    const _blockKey = this.getBlockKey(type, identifier);
    await _RedisEdge.del(_key);
    await _RedisEdge.del(_blockKey);
  }

  async getRemainingAttempts(type: string, identifier: string): Promise<number> {
    const _key = this.getKey(type, identifier);
    const attemptsStr = await _RedisEdge.get(_key);
    return Math.max(0, this.config.maxAttempts - parseInt(attemptsStr || '0', 10));
  }

  async isBlocked(type: string, identifier: string): Promise<boolean> {
    const _blockKey = this.getBlockKey(type, identifier);
    return !!(await _RedisEdge.get(_blockKey));
  }
}
