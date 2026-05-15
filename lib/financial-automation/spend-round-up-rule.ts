import type { Prisma } from '@prisma/client';

/** Stored on `AutomationRule.conditions` to branch the rules engine (Qapital-style round-up). */
export const SPEND_ROUND_UP_ALLOCATION_MODE = 'SPEND_ROUND_UP' as const;

export function isSpendRoundUpConditions(conditions: unknown): boolean {
  if (!conditions || typeof conditions !== 'object' || Array.isArray(conditions)) return false;
  return (conditions as Record<string, unknown>).allocationMode === SPEND_ROUND_UP_ALLOCATION_MODE;
}

export type SpendRoundUpAction = {
  bucket: string;
  mode: 'ROUND_UP';
  /** Round to the next multiple of this many dollars (e.g. 1 = next whole dollar). */
  increment: number;
};

export function parseSpendRoundUpAction(actions: Prisma.JsonValue): SpendRoundUpAction | null {
  if (!Array.isArray(actions) || actions.length === 0) return null;
  const raw = actions[0];
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const rec = raw as Record<string, unknown>;
  if (rec.mode !== 'ROUND_UP') return null;
  const bucket = typeof rec.bucket === 'string' ? rec.bucket.trim() : '';
  const increment = typeof rec.increment === 'number' ? rec.increment : Number(rec.increment);
  if (!bucket || !Number.isFinite(increment) || increment <= 0 || increment > 100) return null;
  return { bucket, mode: 'ROUND_UP', increment };
}

/**
 * Spare change from rounding spend up to the next increment boundary (e.g. next dollar).
 * @param spendAbs absolute purchase amount (> 0)
 */
export function computeSpendRoundUpAmount(spendAbs: number, increment: number): number {
  if (!Number.isFinite(spendAbs) || spendAbs <= 0) return 0;
  const inc = increment > 0 ? increment : 1;
  const next = Math.ceil(spendAbs / inc) * inc;
  const delta = Number((next - spendAbs).toFixed(2));
  return Math.max(0, delta);
}
