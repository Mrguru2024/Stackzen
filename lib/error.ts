import { redactValue } from '@/lib/security/redact';

export interface ErrorLog {
  message: string;
  stack?: string;
  digest?: string;
  timestamp: string;
  url: string;
  userAgent: string;
  componentStack?: string;
  metadata?: Record<string, unknown>;
}

type CaughtError = Error & { digest?: string };

/** Build a serializable log entry from Next/React error boundary props. */
export function toErrorLog(
  caught: CaughtError | unknown,
  win?: Pick<Window, 'location' | 'navigator'> | null
): ErrorLog {
  const err = caught instanceof Error ? caught : null;
  const digest =
    err && 'digest' in err && typeof err.digest === 'string'
      ? err.digest
      : typeof caught === 'object' &&
          caught !== null &&
          'digest' in caught &&
          typeof (caught as { digest?: unknown }).digest === 'string'
        ? (caught as { digest: string }).digest
        : undefined;

  let message = err?.message?.trim() ?? '';
  if (!message && typeof caught === 'string') {
    message = caught.trim();
  }
  if (!message && caught !== null && typeof caught === 'object') {
    try {
      const serialized = JSON.stringify(caught);
      if (serialized && serialized !== '{}') {
        message = serialized;
      }
    } catch {
      /* circular */
    }
  }
  if (!message) {
    message = digest ? `Application error (digest: ${digest})` : 'Unknown error';
  }

  return {
    message,
    stack: err?.stack,
    digest,
    timestamp: new Date().toISOString(),
    url: win?.location?.href ?? 'unknown',
    userAgent: win?.navigator?.userAgent ?? 'unknown',
  };
}

function devLogError(entry: ErrorLog, raw?: unknown) {
  if (process.env.NODE_ENV !== 'development') {
    return;
  }
  console.error(`[StackZen] ${entry.message}`);
  if (entry.digest) {
    console.error(`[StackZen] digest: ${entry.digest}`);
  }
  if (entry.stack) {
    console.error(entry.stack);
  }
  if (raw !== undefined) {
    console.error('[StackZen] raw error:', redactValue(raw));
  }
}

class ErrorLogger {
  private static instance: ErrorLogger;
  private recentErrors: ErrorLog[] = [];
  private readonly MAX_RECENT_ERRORS = 100;

  private constructor() {}

  static getInstance(): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger();
    }
    return ErrorLogger.instance;
  }

  log(entry: ErrorLog, raw?: unknown) {
    this.recentErrors.unshift(entry);
    if (this.recentErrors.length > this.MAX_RECENT_ERRORS) {
      this.recentErrors.pop();
    }

    devLogError(entry, raw);

    if (process.env.NODE_ENV === 'production') {
      void import('@/lib/security/sentry').then(({ captureSafeException }) =>
        captureSafeException(raw instanceof Error ? raw : new Error(entry.message), {
          digest: entry.digest,
          url: entry.url,
        })
      );
    }
  }

  getRecentErrors(): ErrorLog[] {
    return [...this.recentErrors];
  }

  clearRecentErrors() {
    this.recentErrors = [];
  }
}

export const _logError = (entry: ErrorLog, raw?: unknown) => {
  ErrorLogger.getInstance().log(entry, raw);
};

export const _getRecentErrors = () => {
  return ErrorLogger.getInstance().getRecentErrors();
};

export const _clearRecentErrors = () => {
  ErrorLogger.getInstance().clearRecentErrors();
};

export { _logError as logError, _getRecentErrors as getRecentErrors, _clearRecentErrors as clearRecentErrors };
