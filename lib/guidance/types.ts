import type { AutomationClientAction } from '@/lib/financial-automation/actionable-metadata';
import type { RiskCode } from '@/lib/cashflow/types';

export type GuidanceLogicalKind =
  | 'ALLOCATION_ADJUSTMENT'
  | 'GOAL_PACING'
  | 'CASH_FLOW_SAFETY'
  | 'BILL_TIMING'
  | 'CONTRACTOR_RESERVE'
  | 'SPENDING_REDUCTION'
  | 'INVOICE_FOLLOWUP'
  | 'EMERGENCY_RESERVE';

export type GuidancePriorityLevel = 'critical' | 'high' | 'medium' | 'low';

export interface GuidanceExplainability {
  why: string;
  dataInfluences: string[];
  calculations: string[];
  expectedImpact: string;
  /** 0–1 deterministic weight from source risk or heuristic */
  confidence: number;
}

export interface GuidanceRecommendation {
  /** Stable id for upsert / attentionKind suffix */
  attentionKey: string;
  logicalKind: GuidanceLogicalKind;
  priority: GuidancePriorityLevel;
  title: string;
  body: string;
  explain: GuidanceExplainability;
  /** Underlying cashflow risk code when applicable */
  sourceRiskCode?: RiskCode;
  /** Deep links rendered in Operational Center */
  clientActions: AutomationClientAction[];
}
