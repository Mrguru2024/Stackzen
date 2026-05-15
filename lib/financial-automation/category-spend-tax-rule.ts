import type { Prisma } from '@prisma/client';

/** Stored on `AutomationRule.conditions` — “guilt tax” on matching category spend. */
export const CATEGORY_SPEND_TAX_ALLOCATION_MODE = 'CATEGORY_SPEND_TAX' as const;

export function isCategorySpendTaxConditions(conditions: unknown): boolean {
  if (!conditions || typeof conditions !== 'object' || Array.isArray(conditions)) return false;
  return (conditions as Record<string, unknown>).allocationMode === CATEGORY_SPEND_TAX_ALLOCATION_MODE;
}

export type CategorySpendTaxAction = {
  bucket: string;
  mode: 'SPEND_PERCENT';
  spendPercent: number;
  /** Optional per-transaction cap in USD. */
  maxAmountUsd?: number;
};

export function parseCategorySpendTaxAction(actions: Prisma.JsonValue): CategorySpendTaxAction | null {
  if (!Array.isArray(actions) || actions.length === 0) return null;
  const raw = actions[0];
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const rec = raw as Record<string, unknown>;
  if (rec.mode !== 'SPEND_PERCENT') return null;
  const bucket = typeof rec.bucket === 'string' ? rec.bucket.trim() : '';
  const spendPercent = typeof rec.spendPercent === 'number' ? rec.spendPercent : Number(rec.spendPercent);
  const maxRaw = rec.maxAmountUsd;
  const maxAmountUsd =
    maxRaw === undefined || maxRaw === null
      ? undefined
      : typeof maxRaw === 'number'
        ? maxRaw
        : Number(maxRaw);
  if (!bucket || !Number.isFinite(spendPercent) || spendPercent <= 0 || spendPercent > 100) return null;
  if (maxAmountUsd != null && (!Number.isFinite(maxAmountUsd) || maxAmountUsd <= 0)) return null;
  return { bucket, mode: 'SPEND_PERCENT', spendPercent, maxAmountUsd };
}
