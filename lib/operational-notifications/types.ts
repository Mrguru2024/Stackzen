import type {
  AutomationNotificationType,
  FinancialEntityType,
  NotificationSeverity,
} from '@prisma/client';
import type { AutomationClientAction } from '@/lib/financial-automation/actionable-metadata';
import type { OperationalExplainabilityDto } from '@/lib/explainability/types';
import type { UnifiedOperationalCommandCenterDto } from '@/lib/operational-command-center/types';

export type OperationalUiPriority = 'critical' | 'warning' | 'informational' | 'resolved';

export type OperationalUiDomain =
  | 'financial'
  | 'automation'
  | 'work'
  | 'invoice'
  | 'billing'
  | 'goals'
  | 'guidance';

export interface OperationalTrustDto {
  why: string;
  whatChanged?: string;
  recommendedNextStep: string;
  sourceEventType?: string;
}

export interface OperationalAlertDto {
  id: string;
  automationType: AutomationNotificationType;
  domain: OperationalUiDomain;
  uiPriority: OperationalUiPriority;
  severity: NotificationSeverity;
  title: string;
  body: string;
  createdAt: string;
  readAt: string | null;
  /** Unread, not dismissed, not snoozed — default attention queue driver */
  inAttentionQueue: boolean;
  /** Hidden from Attention queue until snooze ends or dismissed cleared */
  suppressed: boolean;
  relatedEntityType: FinancialEntityType | null;
  relatedEntityId: string | null;
  actions: AutomationClientAction[];
  trust: OperationalTrustDto;
  lastFinancialEvent?: {
    type: string;
    createdAt: string;
    metadata: unknown;
  };
  /**
   * Fingerprint for safe dedupe (e.g. same forecast risk from cashflow + guidance).
   * Null when no stable key exists.
   */
  dedupeKey: string | null;
  /** Deterministic audit + structured reasoning (no generated prose). */
  explainability: OperationalExplainabilityDto;
}

export interface OperationalAlertsResponseDto {
  alerts: OperationalAlertDto[];
  grouped: Record<OperationalUiDomain, OperationalAlertDto[]>;
  /** Present when `GET .../alerts?includeCommandCenter=true` — single coordinated read model (no extra forecast if ensure already built the bundle). */
  commandCenter?: UnifiedOperationalCommandCenterDto;
}
