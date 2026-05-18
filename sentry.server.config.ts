import * as Sentry from '@sentry/nextjs';
import { getSharedSentryInitOptions } from '@/lib/security/sentry';

Sentry.init({
  ...getSharedSentryInitOptions(),
  tracesSampleRate: undefined,
});
