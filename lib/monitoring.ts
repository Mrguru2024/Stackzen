// import * as Sentry from '@sentry/nextjs';

// Initialize Sentry
export const _initSentry = () => {
  // if (process.env.NODE_ENV === 'production') {
  //   Sentry.init({
  //     dsn: process.env.SENTRY_DSN,
  //     environment: process.env.NODE_ENV,
  //     // Performance Monitoring
  //     tracesSampleRate: 1.0,
  //     // Disable profiling in browser
  //     profilesSampleRate: 0,
  //     // Enable automatic instrumentation
  //     // integrations: [],
  //     // Only capture errors in production
  //     enabled: process.env.NODE_ENV === 'production',
  //     // Ignore certain errors
  //     ignoreErrors: [
  //       // Ignore React hydration errors
  //       /hydration/i,
  //       // Ignore network errors
  //       /network request failed/i,
  //       // Ignore browser-specific errors
  //       /ResizeObserver loop limit exceeded/i,
  //       // Ignore OpenTelemetry errors
  //       /opentelemetry/i,
  //     ],
  //   });
  // }
};

// Custom logger
export const logger = {
  info: (_message: string, _meta?: Record<string, any>) => {
    // if (process.env.NODE_ENV === 'production') {
    //   Sentry.addBreadcrumb({
    //     category: 'info',
    //     message,
    //     level: 'info',
    //     data: meta,
    //   });
    // }
  },
  error: (_error: Error, _meta?: Record<string, any>) => {
    // if (process.env.NODE_ENV === 'production') {
    //   Sentry.captureException(error, {
    //     extra: meta,
    //   });
    // }
  },
  warn: (_message: string, _meta?: Record<string, any>) => {
    // if (process.env.NODE_ENV === 'production') {
    //   Sentry.addBreadcrumb({
    //     category: 'warning',
    //     message,
    //     level: 'warning',
    //     data: meta,
    //   });
    // }
  },
};

// Performance monitoring wrapper
export const _withPerformanceMonitoring = <T extends (...args: any[]) => any>(
  fn: T,
  name: string
): T => {
  return (async (...args: Parameters<T>) => {
    const start = performance.now();
    try {
      const result = await fn(...args);
      const duration = performance.now() - start;

      if (process.env.ENABLE_PERFORMANCE_MONITORING === 'true') {
        logger.info(`Performance: ${name}`, { duration });
      }

      return result;
    } catch (error) {
      const duration = performance.now() - start;
      logger.error(error as Error, {
        function: name,
        duration,
      });
      throw error;
    }
  }) as T;
};
