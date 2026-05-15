import {
  AutomationExecutionStatus,
  AutomationNotificationChannel,
  AutomationNotificationType,
  AutomationRule,
  AutomationRuleType,
  FinancialEntityType,
  FinancialEventSource,
  FinancialEventType,
  NotificationSeverity,
  Prisma,
  SubscriptionLevel,
} from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { createFinancialEventSafe } from '@/lib/financial-events/events';
import { hasAdvancedAutomationAccess } from '@/lib/financial-automation/premium';
import {
  automationAllocationSourceForRule,
  replaceAutomationAllocationsForTransaction,
} from '@/lib/financial-automation/allocation-persistence';
import { conditionsAllowRule } from '@/lib/financial-automation/rule-conditions';
import {
  classifyOperationalTransaction,
  isOperationalIncomeEligible,
  parseOperationalFromMetadata,
  type OperationalTransactionClass,
} from '@/lib/financial-automation/classification';
import {
  buildAutomationActionMetadata,
} from '@/lib/financial-automation/actionable-metadata';
import {
  computeSpendRoundUpAmount,
  isSpendRoundUpConditions,
  parseSpendRoundUpAction,
} from '@/lib/financial-automation/spend-round-up-rule';
import {
  isCategorySpendTaxConditions,
  parseCategorySpendTaxAction,
} from '@/lib/financial-automation/category-spend-tax-rule';

type AllocationAction = { bucket: string; percent: number };
type GuardrailAction = { warnAtPercent?: number };

function parseArrayOfActions<T>(value: Prisma.JsonValue): T[] {
  if (!Array.isArray(value)) return [];
  return value as T[];
}

const LOW_BALANCE_THRESHOLD_USD = Number(process.env.STACKZEN_LOW_BALANCE_ALERT_USD ?? '100');

function parseTxnMetadata(md: unknown): Record<string, unknown> {
  if (md && typeof md === 'object' && !Array.isArray(md)) {
    return { ...(md as Record<string, unknown>) };
  }
  return {};
}

export async function evaluateAutomationForTransaction(input: {
  userId: string;
  transactionId: string;
  amount: number;
  categoryName?: string | null;
  direction: 'INFLOW' | 'OUTFLOW';
  triggerRef?: string;
  operationalClass?: OperationalTransactionClass | null;
  description?: string | null;
}) {
  const user = await prisma.user.findUnique({
    where: { id: input.userId },
    select: { subscriptionLevel: true },
  });
  const subscriptionLevel = user?.subscriptionLevel ?? SubscriptionLevel.FREE;

  const txn = await prisma.financialTransaction.findFirst({
    where: { id: input.transactionId, userId: input.userId },
    select: {
      id: true,
      description: true,
      direction: true,
      amount: true,
      categoryName: true,
      isTransfer: true,
      metadata: true,
      subcategory: true,
    },
  });

  const description = input.description ?? txn?.description ?? '';
  const metadataRec = parseTxnMetadata(txn?.metadata);
  const pfc =
    (metadataRec.personal_finance_category as { detailed?: string } | undefined)?.detailed ??
    txn?.subcategory ??
    null;

  const fromMeta = parseOperationalFromMetadata(txn?.metadata);
  const classified =
    fromMeta ??
    classifyOperationalTransaction({
      direction: txn?.direction ?? (input.direction === 'INFLOW' ? 'INFLOW' : 'OUTFLOW'),
      description,
      isTransferHint: Boolean(txn?.isTransfer),
      plaidPersonalFinanceDetailed: pfc,
      userCategoryNameHint: input.categoryName ?? txn?.categoryName,
    });

  const operationalClass = (input.operationalClass ?? classified.operationalClass) as OperationalTransactionClass;
  const isTransferHint = Boolean(txn?.isTransfer) || operationalClass === 'TRANSFER';

  const rules = await prisma.automationRule.findMany({
    where: {
      userId: input.userId,
      enabled: true,
      triggerType: 'TRANSACTION_POSTED',
    },
    orderBy: { priority: 'asc' },
  });

  let incomeAllocationApplied = false;
  let spendRoundUpApplied = false;
  let categorySpendTaxApplied = false;

  for (const rule of rules) {
    if (rule.premiumRequired && !hasAdvancedAutomationAccess(subscriptionLevel)) {
      await prisma.automationExecution.create({
        data: {
          userId: input.userId,
          ruleId: rule.id,
          triggerRef: input.triggerRef,
          status: AutomationExecutionStatus.SKIPPED,
          errorCode: 'PREMIUM_REQUIRED',
          errorMessage: 'Premium subscription required',
          inputSnapshot: { ...input, operationalClass } as Prisma.InputJsonValue,
        },
      });
      continue;
    }

    if (!conditionsAllowRule({
      conditions: rule.conditions,
      direction: input.direction,
      amount: input.amount,
      operationalClass,
      isTransferHint,
      categoryName: input.categoryName ?? txn?.categoryName,
    })) {
      await prisma.automationExecution.create({
        data: {
          userId: input.userId,
          ruleId: rule.id,
          triggerRef: input.triggerRef,
          status: AutomationExecutionStatus.SKIPPED,
          errorCode: 'CONDITIONS_NOT_MET',
          errorMessage: 'Rule conditions did not match this transaction',
          inputSnapshot: { ...input, operationalClass } as Prisma.InputJsonValue,
          completedAt: new Date(),
        },
      });
      continue;
    }

    try {
      const result = await executeRule(rule, {
        userId: input.userId,
        transactionId: input.transactionId,
        amount: input.amount,
        categoryName: input.categoryName ?? txn?.categoryName,
        direction: input.direction,
        operationalClass,
        isTransferHint,
        skipIncomeAllocation: incomeAllocationApplied,
        skipSpendRoundUp: spendRoundUpApplied,
        skipCategorySpendTax: categorySpendTaxApplied,
      });

      if (result?.allocationPersisted) {
        incomeAllocationApplied = true;
      }
      if (result?.spendRoundUp) {
        spendRoundUpApplied = true;
      }
      if (result?.categorySpendTax) {
        categorySpendTaxApplied = true;
      }

      await prisma.automationExecution.create({
        data: {
          userId: input.userId,
          ruleId: rule.id,
          triggerRef: input.triggerRef,
          status: AutomationExecutionStatus.SUCCEEDED,
          inputSnapshot: { ...input, operationalClass } as Prisma.InputJsonValue,
          resultSnapshot: result as Prisma.InputJsonValue,
          completedAt: new Date(),
        },
      });

      await createFinancialEventSafe({
        userId: input.userId,
        type: FinancialEventType.AUTOMATION_RULE_EXECUTED,
        source: FinancialEventSource.API_AUTOMATION,
        relatedEntityType: FinancialEntityType.AUTOMATION_RULE,
        relatedEntityId: rule.id,
        metadata: {
          transactionId: input.transactionId,
          ruleType: rule.type,
          allocationPersisted: Boolean(result?.allocationPersisted),
          setAsidePersisted: Boolean(result?.spendRoundUp || result?.categorySpendTax),
        },
      });
    } catch (error) {
      await prisma.automationExecution.create({
        data: {
          userId: input.userId,
          ruleId: rule.id,
          triggerRef: input.triggerRef,
          status: AutomationExecutionStatus.FAILED,
          errorCode: 'RULE_EXECUTION_FAILED',
          errorMessage: error instanceof Error ? error.message : 'Unknown automation error',
          inputSnapshot: { ...input, operationalClass } as Prisma.InputJsonValue,
          completedAt: new Date(),
        },
      });

      await createFinancialEventSafe({
        userId: input.userId,
        type: FinancialEventType.AUTOMATION_RULE_FAILED,
        source: FinancialEventSource.API_AUTOMATION,
        relatedEntityType: FinancialEntityType.AUTOMATION_RULE,
        relatedEntityId: rule.id,
        metadata: {
          transactionId: input.transactionId,
          ruleType: rule.type,
        },
      });
    }
  }

  await maybeNotifyIncomeDetected({
    userId: input.userId,
    transactionId: input.transactionId,
    operationalClass,
  });

  if (input.triggerRef === 'bank-sync') {
    await maybeNotifyLowBalance({ userId: input.userId });
  }
}

async function executeRule(
  rule: AutomationRule,
  input: {
    userId: string;
    transactionId: string;
    amount: number;
    categoryName?: string | null;
    direction: 'INFLOW' | 'OUTFLOW';
    operationalClass: OperationalTransactionClass;
    isTransferHint: boolean;
    skipIncomeAllocation: boolean;
    skipSpendRoundUp: boolean;
    skipCategorySpendTax: boolean;
  }
): Promise<Record<string, unknown>> {
  if (rule.type === AutomationRuleType.ALLOCATION) {
    if (isSpendRoundUpConditions(rule.conditions)) {
      if (input.skipSpendRoundUp) {
        return { skipped: true, reason: 'spend_round_up_already_applied' };
      }
      if (input.direction !== 'OUTFLOW') {
        return { skipped: true, reason: 'round_up_requires_outflow' };
      }
      if (input.isTransferHint || input.operationalClass === 'TRANSFER') {
        return { skipped: true, reason: 'transfer_excluded' };
      }
      const ru = parseSpendRoundUpAction(rule.actions);
      if (!ru) {
        return { skipped: true, reason: 'invalid_round_up_actions' };
      }
      const spendAbs = Math.abs(input.amount);
      const allocatedAmount = computeSpendRoundUpAmount(spendAbs, ru.increment);
      if (allocatedAmount <= 0) {
        return { skipped: true, reason: 'no_round_up_remainder', spendAbs };
      }

      const allocationSource = automationAllocationSourceForRule(rule.id);
      await replaceAutomationAllocationsForTransaction({
        userId: input.userId,
        financialTransactionId: input.transactionId,
        ruleId: rule.id,
        ruleName: rule.name,
        allocationSource,
        allocations: [{ bucket: ru.bucket, allocatedAmount }],
      });

      return {
        spendRoundUp: true,
        bucket: ru.bucket,
        increment: ru.increment,
        allocatedAmount,
      };
    }

    if (isCategorySpendTaxConditions(rule.conditions)) {
      if (input.skipCategorySpendTax) {
        return { skipped: true, reason: 'category_spend_tax_already_applied' };
      }
      if (input.direction !== 'OUTFLOW') {
        return { skipped: true, reason: 'category_tax_requires_outflow' };
      }
      if (input.isTransferHint || input.operationalClass === 'TRANSFER') {
        return { skipped: true, reason: 'transfer_excluded' };
      }
      const tax = parseCategorySpendTaxAction(rule.actions);
      if (!tax) {
        return { skipped: true, reason: 'invalid_category_tax_actions' };
      }
      const spendAbs = Math.abs(input.amount);
      let allocatedAmount = Number(((spendAbs * tax.spendPercent) / 100).toFixed(2));
      if (tax.maxAmountUsd != null && Number.isFinite(tax.maxAmountUsd)) {
        allocatedAmount = Math.min(allocatedAmount, tax.maxAmountUsd);
      }
      if (allocatedAmount <= 0) {
        return { skipped: true, reason: 'zero_category_tax' };
      }

      const allocationSource = automationAllocationSourceForRule(rule.id);
      await replaceAutomationAllocationsForTransaction({
        userId: input.userId,
        financialTransactionId: input.transactionId,
        ruleId: rule.id,
        ruleName: rule.name,
        allocationSource,
        allocations: [{ bucket: tax.bucket, allocatedAmount }],
      });

      return {
        categorySpendTax: true,
        bucket: tax.bucket,
        spendPercent: tax.spendPercent,
        allocatedAmount,
      };
    }

    if (input.skipIncomeAllocation) {
      return { skipped: true, reason: 'allocation_already_applied' };
    }
    if (input.direction !== 'INFLOW') {
      return { skipped: true, reason: 'allocation_requires_inflow' };
    }
    if (input.isTransferHint || input.operationalClass === 'TRANSFER') {
      return { skipped: true, reason: 'transfer_excluded' };
    }
    if (!isOperationalIncomeEligible(input.operationalClass)) {
      return { skipped: true, reason: 'operational_class_not_income_eligible' };
    }

    const actions = parseArrayOfActions<AllocationAction>(rule.actions);
    const baseAmount = Math.abs(input.amount);
    const allocationResults = actions.map(action => ({
      bucket: action.bucket,
      allocatedAmount: Number(((baseAmount * action.percent) / 100).toFixed(2)),
    }));

    const allocationSource = automationAllocationSourceForRule(rule.id);
    await replaceAutomationAllocationsForTransaction({
      userId: input.userId,
      financialTransactionId: input.transactionId,
      ruleId: rule.id,
      ruleName: rule.name,
      allocationSource,
      allocations: allocationResults,
    });

    return { allocations: allocationResults, allocationPersisted: true };
  }

  if (rule.type === AutomationRuleType.GUARDRAIL) {
    const actions = parseArrayOfActions<GuardrailAction>(rule.actions);
    const warnAtPercent = actions[0]?.warnAtPercent ?? 80;

    const guardrails = await prisma.spendingGuardrailPolicy.findMany({
      where: { userId: input.userId, enabled: true },
    });

    for (const guardrail of guardrails) {
      const periodStart = guardrail.cycle === 'WEEKLY' ? getPeriodStart(new Date(), 7) : getMonthStart();
      const spent = await prisma.financialTransaction.aggregate({
        where: {
          userId: input.userId,
          direction: 'OUTFLOW',
          postedAt: { gte: periodStart },
          ...(guardrail.categoryName ? { categoryName: guardrail.categoryName } : {}),
        },
        _sum: { amount: true },
      });
      const currentSpent = Math.abs(spent._sum.amount ?? 0);
      const pct = guardrail.limitAmount > 0 ? (currentSpent / guardrail.limitAmount) * 100 : 0;
      if (pct >= warnAtPercent) {
        const type = pct >= 100 ? FinancialEventType.GUARDRAIL_BREACH : FinancialEventType.GUARDRAIL_WARNING;
        await createFinancialEventSafe({
          userId: input.userId,
          type,
          source: FinancialEventSource.API_AUTOMATION,
          relatedEntityType: FinancialEntityType.GUARDRAIL,
          relatedEntityId: guardrail.id,
          metadata: {
            category: guardrail.categoryName,
            spent: currentSpent,
            limit: guardrail.limitAmount,
            percent: pct,
          },
        });
        const sampleTx = await prisma.financialTransaction.findFirst({
          where: {
            userId: input.userId,
            direction: 'OUTFLOW',
            postedAt: { gte: periodStart },
            ...(guardrail.categoryName ? { categoryName: guardrail.categoryName } : {}),
          },
          orderBy: { postedAt: 'desc' },
          select: { id: true },
        });
        await createAutomationNotification({
          userId: input.userId,
          type: AutomationNotificationType.OVERSPENDING_ALERT,
          severity: pct >= 100 ? NotificationSeverity.CRITICAL : NotificationSeverity.WARNING,
          title: pct >= 100 ? 'Guardrail breached' : 'Guardrail warning',
          body: `You have used ${pct.toFixed(0)}% of your ${guardrail.categoryName ?? 'overall'} spending limit.`,
          relatedEntityType: FinancialEntityType.GUARDRAIL,
          relatedEntityId: guardrail.id,
          metadata: buildAutomationActionMetadata([
            ...(sampleTx
              ? [
                  {
                    type: 'REVIEW_TRANSACTION' as const,
                    financialTransactionId: sampleTx.id,
                  },
                  {
                    type: 'ADJUST_CATEGORY' as const,
                    financialTransactionId: sampleTx.id,
                  },
                ]
              : []),
            {
              type: 'EDIT_ALLOCATION_RULE',
              automationRuleId: rule.id,
            },
          ]),
        });
      }
    }

    return { checkedGuardrails: guardrails.length };
  }

  return { skipped: true };
}

async function evaluateLowBalanceForGuardrailRule(userId: string) {
  const accounts = await prisma.bankAccount.findMany({
    where: { userId, isActive: true },
    select: { id: true, availableBalance: true, currentBalance: true },
  });
  let minBal: number | null = null;
  for (const a of accounts) {
    const candidates = [a.availableBalance, a.currentBalance].filter(
      (v): v is number => v != null && Number.isFinite(v)
    );
    if (candidates.length === 0) continue;
    const m = Math.min(...candidates);
    if (minBal == null || m < minBal) minBal = m;
  }
  if (minBal == null || minBal >= LOW_BALANCE_THRESHOLD_USD) return;

  const recent = await prisma.automationNotification.findFirst({
    where: {
      userId,
      type: AutomationNotificationType.LOW_BALANCE_WARNING,
      createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    },
  });
  if (recent) return;

  const latestTxn = await prisma.financialTransaction.findFirst({
    where: { userId },
    orderBy: { postedAt: 'desc' },
    select: { id: true },
  });

  await createAutomationNotification({
    userId,
    type: AutomationNotificationType.LOW_BALANCE_WARNING,
    severity: NotificationSeverity.WARNING,
    title: 'Low balance warning',
    body: `A linked account is at or below $${LOW_BALANCE_THRESHOLD_USD}. Review upcoming bills and transfers.`,
    relatedEntityType: FinancialEntityType.TRANSACTION,
    relatedEntityId: latestTxn?.id,
    metadata: buildAutomationActionMetadata([
      ...(latestTxn
        ? [
            { type: 'REVIEW_TRANSACTION' as const, financialTransactionId: latestTxn.id },
            { type: 'ADJUST_CATEGORY' as const, financialTransactionId: latestTxn.id },
          ]
        : []),
      { type: 'CREATE_GOAL', template: 'emergency-fund' },
    ]),
  });
}

async function maybeNotifyIncomeDetected(input: {
  userId: string;
  transactionId: string;
  operationalClass: OperationalTransactionClass;
}) {
  const map: Partial<Record<OperationalTransactionClass, AutomationNotificationType>> = {
    PAYCHECK: AutomationNotificationType.PAYCHECK_DETECTED,
    GIG_PAYMENT: AutomationNotificationType.AUTOMATION_ACTION,
    CONTRACTOR_PAYMENT: AutomationNotificationType.AUTOMATION_ACTION,
  };
  const nType = map[input.operationalClass];
  if (!nType) return;

  const existing = await prisma.automationNotification.findFirst({
    where: {
      userId: input.userId,
      type: nType,
      relatedEntityId: input.transactionId,
    },
  });
  if (existing) return;

  const title =
    input.operationalClass === 'PAYCHECK'
      ? 'Paycheck detected'
      : input.operationalClass === 'GIG_PAYMENT'
        ? 'Gig payment deposited'
        : 'Contractor payment deposited';

  await createAutomationNotification({
    userId: input.userId,
    type: nType,
    severity: NotificationSeverity.INFO,
    title,
    body: 'Review categorization and allocation so your budget stays accurate.',
    relatedEntityType: FinancialEntityType.TRANSACTION,
    relatedEntityId: input.transactionId,
    metadata: buildAutomationActionMetadata([
      { type: 'REVIEW_TRANSACTION', financialTransactionId: input.transactionId },
      { type: 'ADJUST_CATEGORY', financialTransactionId: input.transactionId },
      { type: 'MARK_EXPECTED', financialTransactionId: input.transactionId },
    ]),
  });
}

async function maybeNotifyLowBalance(input: { userId: string }) {
  await evaluateLowBalanceForGuardrailRule(input.userId);
}

function getPeriodStart(now: Date, daysBack: number): Date {
  const start = new Date(now);
  start.setDate(start.getDate() - daysBack);
  return start;
}

function getMonthStart(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

export async function createAutomationNotification(input: {
  userId: string;
  type: AutomationNotificationType;
  title: string;
  body: string;
  severity?: NotificationSeverity;
  channel?: AutomationNotificationChannel;
  relatedEntityType?: FinancialEntityType;
  relatedEntityId?: string;
  metadata?: Prisma.InputJsonValue;
}) {
  const notification = await prisma.automationNotification.create({
    data: {
      userId: input.userId,
      type: input.type,
      channel: input.channel ?? AutomationNotificationChannel.IN_APP,
      title: input.title,
      body: input.body,
      severity: input.severity ?? NotificationSeverity.INFO,
      relatedEntityType: input.relatedEntityType,
      relatedEntityId: input.relatedEntityId,
      metadata: input.metadata,
    },
  });

  await createFinancialEventSafe({
    userId: input.userId,
    type: FinancialEventType.AUTOMATION_NOTIFICATION_CREATED,
    source: FinancialEventSource.API_AUTOMATION,
    relatedEntityType: FinancialEntityType.AUTOMATION_NOTIFICATION,
    relatedEntityId: notification.id,
    metadata: {
      notificationType: input.type,
      channel: input.channel ?? AutomationNotificationChannel.IN_APP,
    },
  });

  return notification;
}
