/**
 * Deterministic operational explainability — no LLM output.
 * Versioned for safe API/client evolution.
 */

export type ExplainabilityLifecyclePrimary = 'active' | 'acknowledged' | 'suppressed' | 'resolved';

export interface OperationalExplainabilityLifecycleDto {
  primary: ExplainabilityLifecyclePrimary;
  readAt: string | null;
  dismissedAt?: string;
  snoozedUntil?: string;
  guidanceAppliedAt?: string;
  autoResolvedAt?: string;
  autoResolvedReason?: string;
}

export type OperationalExplainabilityBlockDto =
  | {
      kind: 'guidance_engine';
      logicalKind: string;
      priority: string;
      riskCode: string | null;
      calculations: string[];
      inputsUsed: Record<string, unknown>;
      confidence: number;
      expectedImpact: string;
      engineVersion: number | null;
    }
  | {
      kind: 'cashflow_risk';
      riskCode: string;
      confidence: number;
      summary: string;
      detail: string;
    }
  | {
      kind: 'goal_planning';
      findingCode: string;
      reasoningLines: string[];
    }
  | {
      kind: 'trust_reference';
      why: string;
      whatChanged?: string;
      recommendedNextStep: string;
      sourceEventType?: string;
    };

export interface OperationalExplainabilityAuditEventDto {
  id: string;
  type: string;
  source: string;
  createdAt: string;
  metadata: unknown;
}

export interface OperationalExplainabilityDto {
  version: 1;
  notificationId: string;
  attentionKind?: string;
  lifecycle: OperationalExplainabilityLifecycleDto;
  blocks: OperationalExplainabilityBlockDto[];
  auditTrail: OperationalExplainabilityAuditEventDto[];
}
