import { redactForLog } from '@/lib/security/redact';

/** Use instead of console.error in financial / auth routes. */
export function logSafeError(tag: string, ...args: unknown[]): void {
  const redacted = redactForLog(...args);
  console.error(`[${tag}]`, ...redacted);
}

export function logSafeWarn(tag: string, ...args: unknown[]): void {
  const redacted = redactForLog(...args);
  console.warn(`[${tag}]`, ...redacted);
}
