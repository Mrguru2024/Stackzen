import type { OperationalActionKind } from '@/lib/operational-actions/types';
import type { OperationalExecutionHandoffDto } from '@/lib/operational-execution-context/types';

export type OperationalSubsystemKey = 'reserve' | 'timing' | 'contractor' | 'workflow';

export type OperationalSubsystemBand = 'escalating' | 'coordination' | 'stabilizing';

export interface UnifiedOperationalSubsystemRowDto {
  key: OperationalSubsystemKey;
  label: string;
  band: OperationalSubsystemBand;
  headline: string;
  detail: string;
  inputsUsed: Record<string, string | number | boolean | null>;
  href: string;
}

export interface UnifiedOperationalStabilizationDto {
  momentumFactorCount: number;
  momentumFactorCodes: string[];
  attentionAutoResolvedInWindow: number;
  appliedActionKindsInWindow: { kind: OperationalActionKind; count: number }[];
}

export interface UnifiedOperationalContinuationDto {
  pendingOperationalActionsCount: number;
  pendingShiftBillProposalsCount: number;
  openAttentionQueueSize: number;
  oldestPendingProposalAgeDays: number | null;
  primaryCta: { href: string; label: string; reason: string };
  /** URL handoff hints when continuation is composed from the command center (non-authoritative UX). */
  executionHandoff?: OperationalExecutionHandoffDto;
}

export interface UnifiedOperationalCommandCenterExplainDto {
  assumptions: string[];
  contributors: string[];
}

export interface UnifiedOperationalCommandCenterDto {
  generatedAt: string;
  coordinationBullets: string[];
  subsystems: UnifiedOperationalSubsystemRowDto[];
  stabilization: UnifiedOperationalStabilizationDto;
  continuation: UnifiedOperationalContinuationDto;
  explain: UnifiedOperationalCommandCenterExplainDto;
}
