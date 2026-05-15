import { z } from 'zod';
import type { Prisma } from '@prisma/client';

/** Stored on `AutomationRule.conditions` for Qapital-style recurring fixed saves. */
export const FIXED_SCHEDULE_ALLOCATION_MODE = 'FIXED_SCHEDULE' as const;

export function isFixedScheduleAutomationConditions(conditions: unknown): boolean {
  if (!conditions || typeof conditions !== 'object' || Array.isArray(conditions)) return false;
  return (conditions as Record<string, unknown>).allocationMode === FIXED_SCHEDULE_ALLOCATION_MODE;
}

export const fixedScheduleSchema = z.object({
  cadence: z.enum(['WEEKLY', 'MONTHLY']),
  /** UTC weekday: 0 = Sunday … 6 = Saturday. Used when cadence is WEEKLY. */
  dayOfWeek: z.number().int().min(0).max(6).optional(),
  /** 1–28. Used when cadence is MONTHLY (avoids short-month edge cases). */
  dayOfMonth: z.number().int().min(1).max(28).optional(),
});

export type FixedScheduleConfig = z.infer<typeof fixedScheduleSchema>;

export function parseFixedScheduleConfig(schedule: unknown): FixedScheduleConfig | null {
  const r = fixedScheduleSchema.safeParse(schedule);
  return r.success ? r.data : null;
}

export type FixedScheduleAmountAction = {
  bucket: string;
  mode: 'FIXED_AMOUNT_USD';
  amountUsd: number;
};

export function parseFixedScheduleAmountAction(actions: Prisma.JsonValue): FixedScheduleAmountAction | null {
  if (!Array.isArray(actions) || actions.length === 0) return null;
  const raw = actions[0];
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const rec = raw as Record<string, unknown>;
  if (rec.mode !== 'FIXED_AMOUNT_USD') return null;
  const bucket = typeof rec.bucket === 'string' ? rec.bucket.trim() : '';
  const amountUsd = typeof rec.amountUsd === 'number' ? rec.amountUsd : Number(rec.amountUsd);
  if (!bucket || !Number.isFinite(amountUsd) || amountUsd <= 0 || amountUsd > 100_000) return null;
  return { bucket, mode: 'FIXED_AMOUNT_USD', amountUsd };
}

/** Whether this calendar UTC day should fire the scheduled rule (cron runs ~daily). */
export function shouldRunFixedScheduleUtc(now: Date, schedule: unknown): boolean {
  const cfg = parseFixedScheduleConfig(schedule);
  if (!cfg) return false;
  const dow = now.getUTCDay();
  const dom = now.getUTCDate();
  if (cfg.cadence === 'WEEKLY') {
    const target = cfg.dayOfWeek ?? 1;
    return dow === target;
  }
  const targetDay = cfg.dayOfMonth ?? 1;
  return dom === targetDay;
}
