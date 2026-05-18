import { sentryBeforeSend, sentryTracesSampler } from '@/lib/security/sentry';

describe('sentry integration helpers', () => {
  it('redacts authorization headers in beforeSend', () => {
    const event = sentryBeforeSend({
      request: {
        headers: { Authorization: 'Bearer secret-token-12345' },
      },
    } as Parameters<typeof sentryBeforeSend>[0]);

    expect(event?.request?.headers?.Authorization).toMatch(/\[REDACTED\]/);
    expect(event?.request?.headers?.Authorization).not.toContain('secret-token');
  });

  it('samples sensitive routes higher in production', () => {
    const prev = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    const sensitive = sentryTracesSampler({ name: 'GET /api/bank/sync' });
    const normal = sentryTracesSampler({ name: 'GET /api/health' });

    expect(sensitive).toBeGreaterThan(normal);

    process.env.NODE_ENV = prev;
  });

  it('drops ignored hydration noise', () => {
    const event = sentryBeforeSend({
      message: 'Hydration failed because the server rendered HTML did not match',
    } as Parameters<typeof sentryBeforeSend>[0]);

    expect(event).toBeNull();
  });
});
