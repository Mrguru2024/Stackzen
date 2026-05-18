import { auditPublicEnv } from '@/lib/security/public-env';

describe('auditPublicEnv', () => {
  it('flags suspicious NEXT_PUBLIC keys', () => {
    const issues = auditPublicEnv({
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: 'pk_test_ok',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiJ9',
      NEXT_PUBLIC_MY_SECRET: 'hidden',
    });
    expect(issues.some(i => i.includes('NEXT_PUBLIC_MY_SECRET'))).toBe(true);
  });

  it('passes for normal public keys', () => {
    const issues = auditPublicEnv({
      NEXT_PUBLIC_SITE_URL: 'https://stackzen.com',
      NEXT_PUBLIC_TURNSTILE_SITE_KEY: '0x4AAAA',
    });
    expect(issues).toHaveLength(0);
  });
});
