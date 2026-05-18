import { NextResponse } from 'next/server';
import { enforceApiRateLimit } from '@/lib/api/rate-limit-request';
import { RateLimiter } from '@/lib/auth/rate-limit';

jest.mock('@/lib/env', () => ({
  isUpstashRedisConfigured: jest.fn(() => true),
}));

jest.mock('@/lib/auth/rate-limit');

jest.mock('@/lib/security/sentry', () => ({
  maybeSampledRateLimitBreadcrumb: jest.fn(),
}));

describe('API rate limiting', () => {
  const request = new Request('http://localhost/api/admin/users', {
    headers: { 'x-forwarded-for': '203.0.113.10' },
  });

  const checkLimit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (RateLimiter.getInstance as jest.Mock).mockReturnValue({ checkLimit });
    process.env.NODE_ENV = 'test';
    delete process.env.SECURITY_STRICT_RATE_LIMIT;
  });

  it('allows requests under the limit', async () => {
    checkLimit.mockResolvedValue({
      allowed: true,
      remaining: 4,
      reset: 0,
      blocked: false,
    });

    const result = await enforceApiRateLimit(request, 'admin_api');
    expect(result).toBeNull();
    expect(checkLimit).toHaveBeenCalledWith('admin_api', '203.0.113.10');
  });

  it('returns 429 after threshold exceeded', async () => {
    checkLimit.mockResolvedValue({
      allowed: false,
      remaining: 0,
      reset: 0,
      blocked: true,
    });

    const result = await enforceApiRateLimit(request, 'admin_api');
    expect(result).toBeInstanceOf(NextResponse);
    expect(result?.status).toBe(429);

    const body = await result?.json();
    expect(body).toEqual({ error: 'Too many requests' });
  });

  it('returns 503 for strict buckets when Redis is not configured', async () => {
    const { isUpstashRedisConfigured } = await import('@/lib/env');
    (isUpstashRedisConfigured as jest.Mock).mockReturnValue(false);
    process.env.SECURITY_STRICT_RATE_LIMIT = 'true';

    const result = await enforceApiRateLimit(request, 'auth_login', { strict: true });
    expect(result?.status).toBe(503);
  });
});
