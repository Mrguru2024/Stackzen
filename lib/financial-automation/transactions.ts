import { FinancialTransactionDirection, TransactionCategoryKind } from '@prisma/client';
import {
  buildMerchantGroupKey,
  isLikelyTransfer,
} from '@/lib/financial-automation/memo-recognition';

export function inferDirection(amount: number): FinancialTransactionDirection {
  return amount >= 0 ? FinancialTransactionDirection.INFLOW : FinancialTransactionDirection.OUTFLOW;
}

/**
 * Channel-aware transfer detection. Backed by `recognizeMemo` so it understands
 * Venmo cashouts, Zelle transfers, ATM withdrawals, wires, and explicit
 * "internal transfer" phrasing — instead of the four-keyword substring check
 * that previously missed real transfers and mis-labelled real income.
 */
export function isTransferDescription(description: string): boolean {
  return isLikelyTransfer(description);
}

export function inferCategoryKind(
  direction: FinancialTransactionDirection,
  description: string
): TransactionCategoryKind {
  if (isTransferDescription(description)) {
    return TransactionCategoryKind.TRANSFER;
  }

  if (direction === FinancialTransactionDirection.INFLOW) {
    return TransactionCategoryKind.INCOME;
  }

  return TransactionCategoryKind.EXPENSE;
}

export function buildTransactionDedupeHash(parts: {
  source: string;
  externalId?: string | null;
  postedAt: Date;
  amount: number;
  description: string;
  bankAccountId?: string | null;
}) {
  return [
    parts.source,
    parts.externalId ?? '',
    parts.postedAt.toISOString(),
    parts.amount.toFixed(2),
    parts.description.trim().toLowerCase(),
    parts.bankAccountId ?? '',
  ].join('|');
}

/**
 * Recurring-candidate detection now compares merchant *group keys* instead of
 * raw lowercased descriptions, so noisy fields ("VENMO PMT 12345 JOHN" vs
 * "VENMO PMT 67890 JOHN") still match as the same payer.
 */
export function detectRecurringCandidate(
  transactionDescription: string,
  previousDescriptions: string[]
): boolean {
  const key = buildMerchantGroupKey({ description: transactionDescription });
  if (!key || key === 'unknown') return false;
  const sameCount = previousDescriptions.filter(
    d => buildMerchantGroupKey({ description: d }) === key,
  ).length;
  return sameCount >= 2;
}
