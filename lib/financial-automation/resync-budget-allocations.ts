import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import {
  automationAllocationSourceForRule,
  replaceAutomationAllocationsForTransaction,
} from '@/lib/financial-automation/allocation-persistence';
import {
  classifyOperationalTransaction,
  isOperationalIncomeEligible,
  parseOperationalFromMetadata,
  type OperationalTransactionClass,
} from '@/lib/financial-automation/classification';
import { evaluateAutomationForTransaction } from '@/lib/financial-automation/rules-engine';

type AllocationAction = { bucket: string; percent: number };

function parseArrayOfActions(value: Prisma.JsonValue): AllocationAction[] {
  if (!Array.isArray(value)) return [];
  const lines: AllocationAction[] = [];
  for (const raw of value) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) continue;
    const rec = raw as Record<string, unknown>;
    const bucket = typeof rec.bucket === 'string' ? rec.bucket : null;
    const percent = typeof rec.percent === 'number' ? rec.percent : Number(rec.percent);
    if (!bucket || !Number.isFinite(percent)) continue;
    lines.push({ bucket, percent });
  }
  return lines;
}

function parseTxnMetadata(md: unknown): Record<string, unknown> {
  if (md && typeof md === 'object' && !Array.isArray(md)) {
    return { ...(md as Record<string, unknown>) };
  }
  return {};
}

/**
 * After the budget-breakdown rule is saved, keep SmartBucket totals aligned:
 * 1) Recompute lines for every transaction that already had allocations from this rule.
 * 2) Run the full automation pass for recent inflows that never received this rule's lines
 *    (e.g. deposits that arrived while auto-split was off).
 */
export async function resyncBudgetRuleAfterSave(input: { userId: string; ruleId: string }): Promise<{
  resynced: number;
  backfilled: number;
}> {
  const rule = await prisma.automationRule.findFirst({
    where: { id: input.ruleId, userId: input.userId, enabled: true },
    select: { id: true, name: true, actions: true },
  });
  if (!rule) {
    return { resynced: 0, backfilled: 0 };
  }

  const allocationSource = automationAllocationSourceForRule(rule.id);
  const actions = parseArrayOfActions(rule.actions);
  if (actions.length === 0) {
    return { resynced: 0, backfilled: 0 };
  }

  const distinct = await prisma.smartAllocation.findMany({
    where: { userId: input.userId, source: allocationSource },
    distinct: ['financialTransactionId'],
    select: { financialTransactionId: true },
  });
  const txnIds = distinct.map(d => d.financialTransactionId).filter((id): id is string => Boolean(id));

  let resynced = 0;
  for (const financialTransactionId of txnIds) {
    const txn = await prisma.financialTransaction.findFirst({
      where: { id: financialTransactionId, userId: input.userId },
      select: {
        id: true,
        amount: true,
        direction: true,
        description: true,
        isTransfer: true,
        categoryName: true,
        metadata: true,
        subcategory: true,
      },
    });
    if (!txn) continue;

    const fromMeta = parseOperationalFromMetadata(txn.metadata);
    const metadataRec = parseTxnMetadata(txn.metadata);
    const pfc =
      (metadataRec.personal_finance_category as { detailed?: string } | undefined)?.detailed ??
      txn.subcategory ??
      null;
    const classified =
      fromMeta ??
      classifyOperationalTransaction({
        direction: txn.direction,
        description: txn.description,
        isTransferHint: Boolean(txn.isTransfer),
        plaidPersonalFinanceDetailed: pfc,
        userCategoryNameHint: txn.categoryName,
      });
    const operationalClass = classified.operationalClass as OperationalTransactionClass;
    const isTransferHint = Boolean(txn.isTransfer) || operationalClass === 'TRANSFER';

    if (txn.direction !== 'INFLOW' || isTransferHint || !isOperationalIncomeEligible(operationalClass)) {
      await replaceAutomationAllocationsForTransaction({
        userId: input.userId,
        financialTransactionId,
        ruleId: rule.id,
        ruleName: rule.name,
        allocationSource,
        allocations: [],
      });
      resynced++;
      continue;
    }

    const baseAmount = Math.abs(txn.amount);
    const allocationResults = actions.map(action => ({
      bucket: action.bucket,
      allocatedAmount: Number(((baseAmount * action.percent) / 100).toFixed(2)),
    }));

    await replaceAutomationAllocationsForTransaction({
      userId: input.userId,
      financialTransactionId,
      ruleId: rule.id,
      ruleName: rule.name,
      allocationSource,
      allocations: allocationResults,
    });
    resynced++;
  }

  const since = new Date();
  since.setDate(since.getDate() - 60);

  const missing = await prisma.financialTransaction.findMany({
    where: {
      userId: input.userId,
      direction: 'INFLOW',
      isTransfer: false,
      postedAt: { gte: since },
      NOT: { smartAllocations: { some: { source: allocationSource } } },
    },
    orderBy: { postedAt: 'desc' },
    take: 25,
    select: { id: true, amount: true, categoryName: true, description: true },
  });

  let backfilled = 0;
  for (const t of missing) {
    await evaluateAutomationForTransaction({
      userId: input.userId,
      transactionId: t.id,
      amount: t.amount,
      categoryName: t.categoryName,
      direction: 'INFLOW',
      triggerRef: 'budget-breakdown-backfill',
      description: t.description,
    });
    backfilled++;
  }

  return { resynced, backfilled };
}
