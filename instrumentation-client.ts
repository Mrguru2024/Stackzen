// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

'use client';

// import * as Sentry from '@sentry/nextjs';

export function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    try {
      // Sentry.init({
      //   dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      //   tracesSampleRate: 1.0,
      //   debug: process.env.NODE_ENV === 'development',
      //   environment: process.env.NODE_ENV,
      //   enabled: process.env.NODE_ENV === 'production',
      //   // Disable features that might cause issues
      //   integrations: [],
      //   enableTracing: false,
      // });
    } catch (error) {
      console.error('Failed to initialize Sentry:', error);
    }
  }
}

// Remove router transition hook as it's not available
// export const _onRouterTransitionStart = Sentry.captureRouterTransitionStart || (() => {});
