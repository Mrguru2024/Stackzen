/**
 * @deprecated Use `lib/api/rate-limit-request.ts` + `lib/auth/rate-limit.ts` (Upstash).
 * In-memory rate limiting is not suitable for production fintech workloads.
 */
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { logger } from './monitoring';

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

import { requestClientIp } from '@/lib/request-ip';

const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export const _rateLimit = (config: RateLimitConfig) => {
  // If in development, override config to be very permissive
  const isDev = process.env.NODE_ENV !== 'production';
  const devConfig = isDev
    ? { maxRequests: 10000, windowMs: 1000 } // 10,000 requests per second in dev
    : config;

  return async (request: NextRequest) => {
    const ip = requestClientIp(request);
    const now = Date.now();
    const windowStart = now - devConfig.windowMs;

    // Clean up old entries
    for (const [key, value] of rateLimitStore.entries()) {
      if (value.resetTime < windowStart) {
        rateLimitStore.delete(key);
      }
    }

    // Get or create rate limit entry
    const entry = rateLimitStore.get(ip) ?? { count: 0, resetTime: now };

    // Check if rate limit exceeded
    if (entry.count >= devConfig.maxRequests) {
      logger.warn('Rate limit exceeded', { ip, path: request.nextUrl.pathname });
      return new NextResponse(JSON.stringify({ error: 'Too many requests' }), {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': Math.ceil((entry.resetTime + devConfig.windowMs - now) / 1000).toString(),
        },
      });
    }

    // Update rate limit
    entry.count++;
    rateLimitStore.set(ip, entry);

    // Add rate limit headers
    const response = NextResponse.next();
    response.headers.set('X-RateLimit-Limit', devConfig.maxRequests.toString());
    response.headers.set('X-RateLimit-Remaining', (devConfig.maxRequests - entry.count).toString());
    response.headers.set('X-RateLimit-Reset', (entry.resetTime + devConfig.windowMs).toString());

    return response;
  };
};
