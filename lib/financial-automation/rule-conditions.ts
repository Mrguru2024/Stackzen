import { z } from 'zod';

const conditionsSchema = z
  .object({
    directions: z.array(z.enum(['INFLOW', 'OUTFLOW'])).optional(),
    /** Minimum absolute transaction amount (always positive ledger amount). */
    minAmount: z.number().finite().optional(),
    maxAmount: z.number().finite().optional(),
    /** Only execute when classified into one of these operational classes */
    operationalClasses: z.array(z.string()).optional(),
    /** Exclude these operational classes */
    excludeOperationalClasses: z.array(z.string()).optional(),
    /** Exclude rows flagged as recurring transfer / transfer-like */
    excludeTransfers: z.boolean().optional(),
    /** When set, transaction categoryName (case-insensitive) must match one of these */
    categoryNames: z.array(z.string()).optional(),
  })
  .passthrough();

export type AutomationConditions = z.infer<typeof conditionsSchema>;

export function parseAutomationConditions(value: unknown): AutomationConditions | null {
  const r = conditionsSchema.safeParse(value);
  return r.success ? r.data : null;
}

export function conditionsAllowRule(input: {
  conditions: unknown | null | undefined;
  direction: 'INFLOW' | 'OUTFLOW';
  amount: number;
  operationalClass: string | null | undefined;
  isTransferHint: boolean;
  categoryName?: string | null;
}): boolean {
  if (input.conditions == null || input.conditions === undefined) {
    return true;
  }
  const parsed = parseAutomationConditions(input.conditions);
  if (!parsed) return false;

  if (parsed.excludeTransfers && input.isTransferHint) {
    return false;
  }
  if (parsed.directions && parsed.directions.length > 0 && !parsed.directions.includes(input.direction)) {
    return false;
  }
  const abs = Math.abs(input.amount);
  if (parsed.minAmount != null && abs < parsed.minAmount) return false;
  if (parsed.maxAmount != null && abs > parsed.maxAmount) return false;

  const op = input.operationalClass ?? '';

  if (parsed.excludeOperationalClasses && parsed.excludeOperationalClasses.length > 0) {
    if (parsed.excludeOperationalClasses.includes(op)) return false;
  }
  if (parsed.operationalClasses && parsed.operationalClasses.length > 0) {
    if (!parsed.operationalClasses.includes(op)) return false;
  }

  if (parsed.categoryNames && parsed.categoryNames.length > 0) {
    const hint = (input.categoryName ?? '').trim().toUpperCase();
    if (!hint) return false;
    const allowed = parsed.categoryNames.map(c => String(c).trim().toUpperCase()).filter(Boolean);
    if (!allowed.some(c => c === hint)) return false;
  }

  return true;
}
