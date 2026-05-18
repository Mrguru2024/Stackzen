import { getAllowedOrigins, resetAllowedOriginsCache } from '@/lib/cors';

describe('cors allowlist', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    resetAllowedOriginsCache();
    process.env = {
      ...originalEnv,
      ALLOWED_ORIGINS: 'https://app.example.com,https://partner.example.com',
      NEXT_PUBLIC_APP_URL: 'https://stackzen.com',
    };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('merges env ALLOWED_ORIGINS with defaults', () => {
    const origins = getAllowedOrigins();
    expect(origins).toContain('https://app.example.com');
    expect(origins).toContain('https://partner.example.com');
    expect(origins).toContain('https://stackzen.com');
    expect(origins).not.toContain('*');
  });
});
