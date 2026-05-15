import { NextResponse } from 'next/server';
import { RateLimiter } from '@/lib/auth/rate-limit';
import { isUpstashRedisConfigured } from '@/lib/env';

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

/**
 * Applies shared Upstash-backed rate limiting when configured.
 * When Redis is not configured: in production returns 503 for `strict` types; in dev allows (documented in audit).
 */
export async function enforceApiRateLimit(
  request: Request,
  bucket: string,
  options?: { strict?: boolean }
): Promise<NextResponse | null> {
  const strict = options?.strict ?? false;
  if (!isUpstashRedisConfigured()) {
    if (strict && process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Service temporarily unavailable' }, { status: 503 });
    }
    return null;
  }

  const ip = getClientIp(request);
  const limiter = RateLimiter.getInstance();
  const result = await limiter.checkLimit(bucket, ip);
  if (!result.allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }
  return null;
}
