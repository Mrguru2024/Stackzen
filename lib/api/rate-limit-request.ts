import { NextResponse } from 'next/server';
import { RateLimiter } from '@/lib/auth/rate-limit';
import { isUpstashRedisConfigured } from '@/lib/env';
import type { RateLimitBucket } from '@/lib/security/proxy-policy';

export function getClientIp(request: Request): string {
  const xf = request.headers.get('x-forwarded-for');
  if (xf) {
    const first = xf.split(',')[0]?.trim();
    if (first) return first;
  }
  const realIp = request.headers.get('x-real-ip')?.trim();
  if (realIp) return realIp;
  return 'unknown';
}

const STRICT_BUCKETS: ReadonlySet<string> = new Set([
  'auth_login',
  'auth_signup',
  'auth_password_reset',
  'ai_chat',
  'financial_write',
  'admin_api',
]);

/**
 * Production strict mode when Upstash is missing:
 * - `SECURITY_STRICT_RATE_LIMIT=true`, or
 * - `NODE_ENV=production` for sensitive buckets.
 */
export function isStrictRateLimitBucket(bucket: string): boolean {
  if (!STRICT_BUCKETS.has(bucket)) return false;
  if (process.env.SECURITY_STRICT_RATE_LIMIT === 'true') return true;
  return process.env.NODE_ENV === 'production';
}

/**
 * Applies shared Upstash-backed rate limiting when configured.
 * Returns 503 in strict mode when Redis is not configured.
 */
export async function enforceApiRateLimit(
  request: Request,
  bucket: string,
  options?: { strict?: boolean }
): Promise<NextResponse | null> {
  const strict = options?.strict ?? isStrictRateLimitBucket(bucket);

  if (!isUpstashRedisConfigured()) {
    if (strict) {
      return NextResponse.json({ error: 'Service temporarily unavailable' }, { status: 503 });
    }
    return null;
  }

  const ip = getClientIp(request);
  const limiter = RateLimiter.getInstance();
  const result = await limiter.checkLimit(bucket, ip);
  if (!result.allowed) {
    const { maybeSampledRateLimitBreadcrumb } = await import('@/lib/security/sentry');
    maybeSampledRateLimitBreadcrumb(bucket, ip);
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }
  return null;
}

export type { RateLimitBucket };
