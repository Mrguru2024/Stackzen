import { FinancialEventSource, FinancialEventType } from '@prisma/client';
import { createFinancialEventSafe } from '@/lib/financial-events/events';
import { runAllOperationalIntegrityChecks } from '@/lib/operational-integrity/checks';
import {
  repairDuplicateUnreadAttentionKinds,
  repairGoalBucketTotalsFromAllocations,
  repairOrphanAndStaleGoalAttention,
} from '@/lib/operational-integrity/repairs';
import type { OperationalIntegrityMode, OperationalIntegrityRunResult } from '@/lib/operational-integrity/types';

export interface RunOperationalIntegrityOptions {
  mode: OperationalIntegrityMode;
}

/**
 * Deterministic operational integrity pass: read-only checks and optional safe repairs.
 * Does not call `reconcileDerivedOperationalAttention` (caller runs that after repairs so detect mode stays read-only).
 * Repairs emit FinancialEvent rows (GOAL_UPDATED / OPERATIONAL_ATTENTION_AUTO_RESOLVED) with explicit metadata.
 */
export async function runOperationalIntegrityScan(
  userId: string,
  options: RunOperationalIntegrityOptions
): Promise<OperationalIntegrityRunResult> {
  const generatedAt = new Date().toISOString();
  const violations = await runAllOperationalIntegrityChecks(userId);
  const repairs = [] as OperationalIntegrityRunResult['repairs'];

  if (options.mode === 'repair_safe') {
    repairs.push(...(await repairGoalBucketTotalsFromAllocations(userId, violations)));
    repairs.push(...(await repairDuplicateUnreadAttentionKinds(userId)));
    repairs.push(...(await repairOrphanAndStaleGoalAttention(userId)));
  }

  const shouldEmitAuditEvent =
    options.mode === 'repair_safe' || (options.mode === 'detect' && violations.length > 0);

  if (shouldEmitAuditEvent) {
    await createFinancialEventSafe({
      userId,
      type: FinancialEventType.OPERATIONAL_INTEGRITY_SCAN,
      source: FinancialEventSource.API_AUTOMATION,
      metadata: {
        mode: options.mode,
        generatedAt,
        violationCount: violations.length,
        violationCodes: violations.map(v => v.code),
        repairCount: repairs.length,
        repairCodes: repairs.map(r => r.code),
        violations: violations.map(v => ({
          code: v.code,
          severity: v.severity,
          summary: v.summary,
          relatedEntityType: v.relatedEntityType ?? null,
          relatedEntityId: v.relatedEntityId ?? null,
        })),
        repairs: repairs.map(r => ({
          code: r.code,
          summary: r.summary,
          relatedEntityType: r.relatedEntityType ?? null,
          relatedEntityId: r.relatedEntityId ?? null,
        })),
      },
    });
  }

  return {
    mode: options.mode,
    generatedAt,
    violations,
    repairs,
    derivedAttentionAutoResolved: 0,
  };
}
