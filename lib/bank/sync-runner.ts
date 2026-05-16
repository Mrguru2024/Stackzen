import { prisma } from '@/lib/prisma';
import { decryptSensitiveString } from '@/lib/security/encryption';
import { syncPlaidTransactions } from '@/lib/bank/plaid';
import {
  FinancialEntityType,
  FinancialEventSource,
  FinancialEventType,
  FinancialTransactionDirection,
  FinancialTransactionSource,
  Prisma,
} from '@prisma/client';
import { createFinancialEventSafe } from '@/lib/financial-events/events';
import { mergeOperationalFromTransactionClassification } from '@/lib/financial-automation/classification';
import {
  buildTransactionDedupeHash,
  detectRecurringCandidate,
  inferCategoryKind,
  isTransferDescription,
} from '@/lib/financial-automation/transactions';
import { evaluateAutomationForTransaction } from '@/lib/financial-automation/rules-engine';

export async function runBankSyncForConnection(userId: string, connectionId: string) {
  const connection = await prisma.bankConnection.findFirst({
    where: { id: connectionId, userId, status: 'ACTIVE' },
  });
  if (!connection) {
    throw new Error('Active bank connection not found');
  }

  const accessToken = decryptSensitiveString(connection.accessTokenEncrypted);
  const sync = await syncPlaidTransactions(accessToken, connection.syncCursor ?? undefined);

  let createdCount = 0;
  for (const tx of sync.data.added) {
    const bankAccount = await prisma.bankAccount.findFirst({
      where: { bankConnectionId: connection.id, providerAccountId: tx.account_id },
      select: { id: true },
    });
    if (!bankAccount) continue;

    const amount = Math.abs(tx.amount);
    const direction =
      tx.amount < 0 ? FinancialTransactionDirection.INFLOW : FinancialTransactionDirection.OUTFLOW;
    const postedAt = new Date(tx.date);
    const description = tx.name || tx.merchant_name || 'Bank transaction';

    const categoryKind = inferCategoryKind(direction, description);
    let category = await prisma.transactionCategory.findFirst({
      where: { userId, name: categoryKind, kind: categoryKind },
    });
    if (!category) {
      category = await prisma.transactionCategory.create({
        data: {
          userId,
          name: categoryKind,
          kind: categoryKind,
          isSystem: true,
        },
      });
    }

    const previous = await prisma.financialTransaction.findMany({
      where: { userId },
      select: { description: true },
      take: 20,
      orderBy: { postedAt: 'desc' },
    });
    const recurringCandidate = detectRecurringCandidate(
      description,
      previous.map(p => p.description)
    );
    const dedupeHash = buildTransactionDedupeHash({
      source: FinancialTransactionSource.PLAID_SYNC,
      externalId: tx.transaction_id,
      postedAt,
      amount,
      description,
      bankAccountId: bankAccount.id,
    });

    const plaidRecord = tx as unknown as Record<string, unknown>;
    const mergedOperationalMetadata = mergeOperationalFromTransactionClassification(plaidRecord, {
      direction,
      description,
      isTransferHint: isTransferDescription(description),
      plaidPersonalFinanceDetailed: tx.personal_finance_category?.detailed ?? null,
    });

    const created = await prisma.financialTransaction.upsert({
      where: {
        userId_dedupeHash: {
          userId,
          dedupeHash,
        },
      },
      update: {
        categoryId: category.id,
        categoryName: category.name,
        merchantName: tx.merchant_name ?? null,
        counterparty: tx.counterparties?.[0]?.name ?? null,
        isTransfer: isTransferDescription(description),
        isRecurringCandidate: recurringCandidate,
        metadata: mergedOperationalMetadata as Prisma.InputJsonValue,
      },
      create: {
        userId,
        bankAccountId: bankAccount.id,
        source: FinancialTransactionSource.PLAID_SYNC,
        externalId: tx.transaction_id,
        dedupeHash,
        postedAt,
        authorizedAt: tx.authorized_date ? new Date(tx.authorized_date) : null,
        amount,
        direction,
        description,
        merchantName: tx.merchant_name ?? null,
        counterparty: tx.counterparties?.[0]?.name ?? null,
        categoryId: category.id,
        categoryName: category.name,
        subcategory: tx.personal_finance_category?.detailed ?? null,
        isTransfer: isTransferDescription(description),
        isRecurringCandidate: recurringCandidate,
        metadata: mergedOperationalMetadata as Prisma.InputJsonValue,
      },
    });
    createdCount += 1;

    await createFinancialEventSafe({
      userId,
      type: FinancialEventType.TRANSACTION_CREATED,
      source: FinancialEventSource.API_BANK,
      amount: created.amount,
      relatedEntityType: FinancialEntityType.TRANSACTION,
      relatedEntityId: created.id,
      metadata: {
        source: created.source,
        direction: created.direction,
        recurringCandidate: created.isRecurringCandidate,
      },
    });

    if (created.isRecurringCandidate) {
      await createFinancialEventSafe({
        userId,
        type: FinancialEventType.RECURRING_TRANSACTION_DETECTED,
        source: FinancialEventSource.API_AUTOMATION,
        relatedEntityType: FinancialEntityType.TRANSACTION,
        relatedEntityId: created.id,
        metadata: { description: created.description },
      });
    }

    await evaluateAutomationForTransaction({
      userId,
      transactionId: created.id,
      amount: created.amount,
      categoryName: created.categoryName,
      direction: created.direction,
      triggerRef: 'bank-sync',
    });
  }

  await prisma.bankConnection.update({
    where: { id: connection.id },
    data: {
      syncCursor: sync.data.next_cursor,
      lastSuccessfulSyncAt: new Date(),
      lastSyncErrorAt: null,
      syncErrorCode: null,
    },
  });

  await createFinancialEventSafe({
    userId,
    type: FinancialEventType.BANK_SYNC_COMPLETED,
    source: FinancialEventSource.API_BANK,
    relatedEntityType: FinancialEntityType.BANK_CONNECTION,
    relatedEntityId: connection.id,
    metadata: { createdCount },
  });

  return {
    connectionId: connection.id,
    createdCount,
    hasMore: sync.data.has_more,
  };
}
