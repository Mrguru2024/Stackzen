import { RedisEdge } from '../redis-edge.ts';
import { RateLimiter } from './rate-limit.ts';

export interface IPBlockConfig {
  maxFailedAttempts: number;
  blockDuration: number; // in seconds
  suspiciousThreshold: number;
  suspiciousDuration: number; // in seconds
}

export class IPBlocker {
  private static instance: IPBlocker;
  private rateLimiter: RateLimiter;
  private config: IPBlockConfig;

  private constructor() {
    this.config = {
      maxFailedAttempts: 5,
      blockDuration: 24 * 60 * 60, // 24 hours
      suspiciousThreshold: 3,
      suspiciousDuration: 60 * 60, // 1 hour
    };
    this.rateLimiter = RateLimiter.getInstance();
  }

  static getInstance(): IPBlocker {
    if (!IPBlocker.instance) {
      IPBlocker.instance = new IPBlocker();
    }
    return IPBlocker.instance;
  }

  async isBlocked(ip: string): Promise<boolean> {
    const blockKey = `ip:block:${ip}`;
    const isBlocked = await RedisEdge.get(blockKey);
    return !!isBlocked;
  }

  async isSuspicious(ip: string): Promise<boolean> {
    const suspiciousKey = `ip:suspicious:${ip}`;
    const isSuspicious = await RedisEdge.get(suspiciousKey);
    return !!isSuspicious;
  }

  async recordFailedAttempt(ip: string): Promise<void> {
    const failedKey = `ip:failed:${ip}`;
    const failedCount = (await RedisEdge.incr(failedKey)) || 1;
    await RedisEdge.expire(failedKey, this.config.blockDuration);

    if (failedCount >= this.config.maxFailedAttempts) {
      await this.blockIP(ip);
    } else if (failedCount >= this.config.suspiciousThreshold) {
      await this.markAsSuspicious(ip);
    }
  }

  async recordSuccessfulAttempt(ip: string): Promise<void> {
    const failedKey = `ip:failed:${ip}`;
    await RedisEdge.del(failedKey);
  }

  private async blockIP(ip: string): Promise<void> {
    const blockKey = `ip:block:${ip}`;
    await RedisEdge.set(blockKey, '1', this.config.blockDuration);

    // Log the blocked IP
    const log = JSON.stringify({
      ip,
      timestamp: new Date().toISOString(),
      reason: 'Too many failed attempts',
    });
    await RedisEdge.set(`ip:blocked:${ip}`, log, this.config.blockDuration);
  }

  private async markAsSuspicious(ip: string): Promise<void> {
    const suspiciousKey = `ip:suspicious:${ip}`;
    await RedisEdge.set(suspiciousKey, '1', this.config.suspiciousDuration);

    // Log the suspicious IP
    const log = JSON.stringify({
      ip,
      timestamp: new Date().toISOString(),
      reason: 'Multiple failed attempts',
    });
    await RedisEdge.set(`ip:suspicious:${ip}`, log, this.config.suspiciousDuration);
  }

  async getBlockedIPs(): Promise<Array<{ ip: string; timestamp: string; reason: string }>> {
    // Upstash does not support lrange, so we store one log per IP
    // This returns all blocked IPs by scanning keys (not efficient for large sets)
    // For demo, just return empty array or implement with a known list
    return [];
  }

  async getSuspiciousIPs(): Promise<Array<{ ip: string; timestamp: string; reason: string }>> {
    // Same as above
    return [];
  }

  async unblockIP(ip: string): Promise<void> {
    const blockKey = `ip:block:${ip}`;
    const failedKey = `ip:failed:${ip}`;
    const suspiciousKey = `ip:suspicious:${ip}`;
    await Promise.all([
      RedisEdge.del(blockKey),
      RedisEdge.del(failedKey),
      RedisEdge.del(suspiciousKey),
    ]);
  }

  async getIPStats(ip: string): Promise<{
    isBlocked: boolean;
    isSuspicious: boolean;
    failedAttempts: number;
    lastFailedAttempt?: string;
  }> {
    const [isBlocked, isSuspicious, failedCountStr] = await Promise.all([
      this.isBlocked(ip),
      this.isSuspicious(ip),
      RedisEdge.get(`ip:failed:${ip}`),
    ]);

    return {
      isBlocked,
      isSuspicious,
      failedAttempts: parseInt(failedCountStr || '0'),
      lastFailedAttempt: undefined, // TTL not supported in Upstash Edge
    };
  }
}
