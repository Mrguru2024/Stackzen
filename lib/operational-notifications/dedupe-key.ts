import type { FinancialEntityType } from '@prisma/client';

/**
 * Stable fingerprint for workspace dedupe (no Prisma runtime — safe in Jest).
 * @see buildOperationalAlertDto
 */
export function buildOperationalDedupeKey(
  meta: Record<string, unknown>,
  relatedType: FinancialEntityType | null,
  relatedId: string | null
): string | null {
  const g =
    meta.guidance && typeof meta.guidance === 'object' && !Array.isArray(meta.guidance)
      ? (meta.guidance as Record<string, unknown>)
      : null;
  if (g && typeof g.riskCode === 'string' && g.riskCode.trim()) {
    return `risk:${g.riskCode.trim()}`;
  }
  const ak = typeof meta.attentionKind === 'string' ? meta.attentionKind : '';
  if (ak.startsWith('cashflow_')) {
    const tail = ak.slice('cashflow_'.length);
    if (tail) return `risk:${tail.toUpperCase()}`;
  }
  if (relatedType && relatedId) {
    return `entity:${relatedType}:${relatedId}`;
  }
  if (ak.startsWith('guidance_')) {
    return `guidance:${ak}`;
  }
  if (ak.startsWith('operational_action_')) {
    return `operational_action:${ak}`;
  }
  if (ak.startsWith('contractor_ops_')) {
    return `contractor_ops:${ak}`;
  }
  if (ak.startsWith('reserve_alloc_ops_')) {
    return `reserve_alloc_ops:${ak}`;
  }
  if (ak.startsWith('timing_')) {
    return `timing:${ak}`;
  }
  return null;
}
