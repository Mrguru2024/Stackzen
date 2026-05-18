import * as Sentry from '@sentry/nextjs';

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { assertCoreServerEnv } = await import('@/lib/env');
    const { assertEncryptionKeyConfigured } = await import('@/lib/security/encryption');
    assertCoreServerEnv();
    assertEncryptionKeyConfigured();
  }
}

export const onRequestError = Sentry.captureRequestError;
