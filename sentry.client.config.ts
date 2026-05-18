import * as Sentry from '@sentry/nextjs';
import { getSharedSentryInitOptions } from '@/lib/security/sentry';

Sentry.init({
  ...getSharedSentryInitOptions(),
  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
  replaysSessionSampleRate: 0.05,
  replaysOnErrorSampleRate: 1.0,
});
