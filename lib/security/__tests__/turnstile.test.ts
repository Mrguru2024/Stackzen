import { verifyTurnstileToken } from '../turnstile';

describe('turnstile', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('fails closed in production when secret is missing', async () => {
    process.env.NODE_ENV = 'production';
    delete process.env.TURNSTILE_SECRET_KEY;

    const result = await verifyTurnstileToken('token');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/not configured/i);
    }
  });

  it('allows missing token in development without secret', async () => {
    process.env.NODE_ENV = 'development';
    delete process.env.TURNSTILE_SECRET_KEY;

    const result = await verifyTurnstileToken('');
    expect(result.ok).toBe(true);
  });
});
