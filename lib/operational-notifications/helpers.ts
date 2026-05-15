/**
 * Operational alert visibility shared by Money Control and Operational Center.
 */

export function isSnoozedOrDismissed(metadata: unknown, nowMs: number = Date.now()): boolean {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return false;
  const o = metadata as Record<string, unknown>;
  const dismissedAt = o.dismissedAt;
  const until = o.snoozedUntil;
  if (typeof dismissedAt === 'string') return true;
  if (typeof until === 'string') {
    const ts = Date.parse(until);
    if (!Number.isNaN(ts) && ts > nowMs) return true;
  }
  return false;
}

export function isDismissed(metadata: unknown): boolean {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return false;
  return typeof (metadata as Record<string, unknown>).dismissedAt === 'string';
}

export function isSnoozedActive(metadata: unknown, nowMs: number = Date.now()): boolean {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return false;
  const until = (metadata as Record<string, unknown>).snoozedUntil;
  if (typeof until !== 'string') return false;
  const ts = Date.parse(until);
  return !Number.isNaN(ts) && ts > nowMs;
}

/** Default operational queue: unread, not snoozed, not dismissed. */
export function isInAttentionQueue(
  row: { readAt: Date | null; metadata: unknown },
  nowMs: number = Date.now()
): boolean {
  if (row.readAt) return false;
  return !isSnoozedOrDismissed(row.metadata, nowMs);
}
