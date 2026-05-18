import { isStrictRateLimitBucket } from '../rate-limit-request';

describe('rate-limit-request', () => {
  const originalEnv = process.env;

  afterEach(() => {
    process.env = originalEnv;
  });

  it('marks sensitive buckets strict when SECURITY_STRICT_RATE_LIMIT=true', () => {
    process.env.SECURITY_STRICT_RATE_LIMIT = 'true';
    process.env.NODE_ENV = 'development';
    expect(isStrictRateLimitBucket('admin_api')).toBe(true);
    expect(isStrictRateLimitBucket('webhook_stripe')).toBe(false);
  });
});
