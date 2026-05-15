import type { FinancialEntityType } from '@prisma/client';

export type OperationalIntegritySeverity = 'info' | 'warning' | 'escalate';

/** Single deterministic finding from a read-only or repair-aware check. */
export interface OperationalIntegrityViolation {
  code: string;
  severity: OperationalIntegritySeverity;
  summary: string;
  detail: string;
  relatedEntityType?: FinancialEntityType;
  relatedEntityId?: string;
  /** Reproducible inputs for explainability / support. */
  evidence?: Record<string, unknown>;
}

/** Auditable deterministic repair (no silent mutations). */
export interface OperationalIntegrityRepairRecord {
  code: string;
  summary: string;
  explain: string[];
  relatedEntityType?: FinancialEntityType;
  relatedEntityId?: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
}

export type OperationalIntegrityMode = 'detect' | 'repair_safe';

export interface OperationalIntegrityRunResult {
  mode: OperationalIntegrityMode;
  generatedAt: string;
  violations: OperationalIntegrityViolation[];
  repairs: OperationalIntegrityRepairRecord[];
  derivedAttentionAutoResolved: number;
}
