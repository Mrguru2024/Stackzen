import type { ErrorEvent, EventHint } from '@sentry/core';
import { hashIp } from '@/lib/security/hash';
import { redactValue } from '@/lib/security/redact';

const SENSITIVE_ROUTE_FRAGMENTS = [
  '/api/bank',
  '/api/invoices',
  '/api/admin',
  '/api/plaid',
  '/api/webhooks/stripe',
  '/api/money-mentor',
  '/api/ai',
];

const IGNORED_ERROR_PATTERNS = [
  /hydration/i,
  /ResizeObserver loop/i,
  /network request failed/i,
  /Load failed/i,
  /AbortError/i,
];

export function isSentryEnabled(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN?.trim());
}

/** Strip tokens, cards, and secrets before events leave the app. */
export function sentryBeforeSend(event: ErrorEvent, _hint?: EventHint): ErrorEvent | null {
  if (event.request) {
    if (event.request.headers) {
      event.request.headers = redactValue(event.request.headers) as Record<string, string>;
    }
    if (event.request.cookies) {
      event.request.cookies = redactValue(event.request.cookies) as Record<string, string>;
    }
    if (typeof event.request.data === 'string') {
      event.request.data = redactValue(event.request.data) as string;
    }
  }

  if (event.extra) {
    event.extra = redactValue(event.extra) as Record<string, unknown>;
  }

  if (event.breadcrumbs) {
    event.breadcrumbs = event.breadcrumbs.map(crumb => ({
      ...crumb,
      message:
        typeof crumb.message === 'string' ? (redactValue(crumb.message) as string) : crumb.message,
      data: crumb.data ? (redactValue(crumb.data) as Record<string, unknown>) : crumb.data,
    }));
  }

  const message = event.exception?.values?.[0]?.value ?? event.message ?? '';
  if (IGNORED_ERROR_PATTERNS.some(pattern => pattern.test(message))) {
    return null;
  }

  return event;
}

export function sentryTracesSampler(samplingContext: {
  name?: string;
  parentSampled?: boolean;
}): number {
  if (samplingContext.parentSampled !== undefined) {
    return samplingContext.parentSampled ? 1 : 0;
  }

  const name = samplingContext.name ?? '';
  const isSensitive = SENSITIVE_ROUTE_FRAGMENTS.some(fragment => name.includes(fragment));

  if (process.env.NODE_ENV !== 'production') {
    return isSensitive ? 0.5 : 0.1;
  }

  return isSensitive ? 0.15 : 0.02;
}

export function getSharedSentryInitOptions() {
  return {
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? 'development',
    enabled:
      isSentryEnabled() &&
      (process.env.NODE_ENV === 'production' || process.env.SENTRY_ENABLE_DEV === 'true'),
    beforeSend: sentryBeforeSend,
    tracesSampler: sentryTracesSampler,
    ignoreErrors: IGNORED_ERROR_PATTERNS.map(p => p.source),
    debug: process.env.SENTRY_DEBUG === 'true',
  } as const;
}

async function getSentry() {
  if (!isSentryEnabled()) return null;
  try {
    return await import('@sentry/nextjs');
  } catch {
    return null;
  }
}

/** Sampled security breadcrumb — no-op when Sentry is disabled. */
export async function addSecurityBreadcrumb(
  message: string,
  data?: Record<string, unknown>,
  level: 'info' | 'warning' | 'error' = 'info'
): Promise<void> {
  const Sentry = await getSentry();
  if (!Sentry) return;

  Sentry.addBreadcrumb({
    category: 'security',
    message,
    level,
    data: data ? (redactValue(data) as Record<string, unknown>) : undefined,
  });
}

export function maybeSampledRateLimitBreadcrumb(bucket: string, ip: string): void {
  const sample = process.env.NODE_ENV === 'production' ? Math.random() < 0.1 : true;
  if (!sample) return;

  void addSecurityBreadcrumb(
    'rate_limit.exceeded',
    { bucket, ipHash: hashIp(ip) },
    'warning'
  );
}

export function auditLogWriteFailedBreadcrumb(action: string): void {
  void addSecurityBreadcrumb('audit_log.write_failed', { action }, 'error');
}

export async function captureSafeException(
  error: unknown,
  context?: Record<string, unknown>
): Promise<void> {
  const Sentry = await getSentry();
  if (!Sentry) return;

  Sentry.captureException(error, {
    extra: context ? (redactValue(context) as Record<string, unknown>) : undefined,
  });
}

/** Tag sensitive API transactions for performance monitoring. */
export function getSentryTransactionName(method: string, path: string): string {
  return `${method} ${path}`;
}
