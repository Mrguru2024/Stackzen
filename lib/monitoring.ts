import {
  addSecurityBreadcrumb,
  captureSafeException,
  isSentryEnabled,
} from '@/lib/security/sentry';

/** @deprecated Sentry auto-inits via sentry.*.config.ts — kept for backward compatibility. */
export const initSentry = (): void => {
  if (process.env.NODE_ENV === 'development' && isSentryEnabled()) {
    console.info('[monitoring] Sentry DSN configured (enabled per sentry config)');
  }
};

export const logger = {
  info: (message: string, meta?: Record<string, unknown>) => {
    void addSecurityBreadcrumb(message, meta, 'info');
  },
  error: (error: Error, meta?: Record<string, unknown>) => {
    void captureSafeException(error, meta);
  },
  warn: (message: string, meta?: Record<string, unknown>) => {
    void addSecurityBreadcrumb(message, meta, 'warning');
  },
};

export const withPerformanceMonitoring = <T extends (...args: unknown[]) => unknown>(
  fn: T,
  name: string
): T => {
  return (async (...args: Parameters<T>) => {
    const start = performance.now();
    try {
      const result = await fn(...args);
      const duration = performance.now() - start;

      if (process.env.ENABLE_PERFORMANCE_MONITORING === 'true') {
        logger.info(`performance.${name}`, { durationMs: Math.round(duration) });
      }

      return result;
    } catch (error) {
      const duration = performance.now() - start;
      await captureSafeException(error, {
        function: name,
        durationMs: Math.round(duration),
      });
      throw error;
    }
  }) as T;
};
