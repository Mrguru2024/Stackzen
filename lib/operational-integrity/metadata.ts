/** Shared attentionKind reader for AutomationNotification.metadata JSON. */
export function readAttentionKindFromMetadata(metadata: unknown): string | null {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return null;
  const v = (metadata as Record<string, unknown>).attentionKind;
  return typeof v === 'string' ? v : null;
}

export function mergeNotificationMetadata(
  metadata: unknown,
  patch: Record<string, unknown>
): Record<string, unknown> {
  const base =
    metadata && typeof metadata === 'object' && !Array.isArray(metadata)
      ? ({ ...(metadata as Record<string, unknown>) } as Record<string, unknown>)
      : ({} as Record<string, unknown>);
  return { ...base, ...patch };
}
