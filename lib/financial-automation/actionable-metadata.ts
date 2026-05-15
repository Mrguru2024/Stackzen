import type { Prisma } from '@prisma/client';

export type AutomationClientAction =
  | { type: 'REVIEW_TRANSACTION'; financialTransactionId: string }
  | { type: 'ADJUST_CATEGORY'; financialTransactionId: string; allowedBudgetCategorySlugs?: string[] }
  | { type: 'EDIT_ALLOCATION_RULE'; automationRuleId: string }
  | { type: 'SNOOZE'; automationNotificationId: string; snoozeHours?: number }
  | { type: 'MARK_EXPECTED'; financialTransactionId: string }
  | { type: 'CREATE_GOAL'; template?: string }
  | { type: 'IGNORE_MERCHANT_TRIGGER'; merchantPattern: string }
  | { type: 'OPEN_INVOICE'; invoiceId: string }
  | { type: 'OPEN_JOB'; jobId: string }
  | { type: 'OPEN_CLIENT'; clientId: string }
  | { type: 'OPEN_BUCKET'; bucketId: string }
  | { type: 'PAY_INVOICE'; invoiceId: string }
  /** Navigate to deterministic Cash Flow projection (no duplicate ledger). */
  | { type: 'OPEN_CASH_FLOW' }
  /** Operational goal planning & execution surface. */
  | { type: 'OPEN_OPERATIONAL_GOAL'; goalId: string }
  /** Money Control deep link (deterministic automation / review surfaces). */
  | { type: 'OPEN_MONEY_CONTROL'; tab?: 'review' | 'rules' | 'buckets' };

export type OperationalAttentionTrust = {
  why: string;
  whatChanged?: string;
  recommendedNextStep: string;
  sourceEventType?: string;
};

export function buildAutomationActionMetadata(actions: AutomationClientAction[]): Prisma.InputJsonValue {
  return { version: 1, actions };
}

export function buildOperationalAttentionMetadata(
  actions: AutomationClientAction[],
  opts: {
    attentionKind: string;
    trust: OperationalAttentionTrust;
  }
): Prisma.InputJsonValue {
  return {
    version: 1,
    actions,
    attentionKind: opts.attentionKind,
    trust: opts.trust,
  };
}
