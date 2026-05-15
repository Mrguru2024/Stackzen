import { FinancialTransactionDirection, FinancialTransactionSource } from '@prisma/client';
import type { FinancialTransaction } from '@prisma/client';
import { computeInflowConcentration } from '@/lib/income-intelligence/concentration';

function makeTx(
  partial: Pick<FinancialTransaction, 'id' | 'postedAt' | 'amount' | 'description'> &
    Partial<FinancialTransaction>
): FinancialTransaction {
  return {
    userId: 'u1',
    bankAccountId: null,
    categoryName: null,
    merchantName: null,
    isTransfer: false,
    metadata: null,
    subcategory: null,
    source: FinancialTransactionSource.PLAID,
    direction: FinancialTransactionDirection.INFLOW,
    externalId: null,
    categoryId: null,
    counterparty: null,
    isRecurringCandidate: false,
    jobId: null,
    invoiceId: null,
    expenseId: null,
    dedupeHash: `dh-${partial.id}`,
    createdAt: partial.postedAt ?? new Date(),
    updatedAt: partial.postedAt ?? new Date(),
    ...partial,
  } as FinancialTransaction;
}

describe('computeInflowConcentration', () => {
  it('computes Herfindahl index for two equal sources', () => {
    const now = new Date('2026-05-01T12:00:00');
    const rows = [
      makeTx({
        id: '1',
        postedAt: new Date('2026-04-15'),
        amount: 500,
        // Distinct payer anchors — the improved fingerprint groups on the first
        // significant token, so payers must differ on that token to count as
        // separate sources (mirrors real-world Plaid merchantName behavior).
        description: 'acme payroll',
      }),
      makeTx({
        id: '2',
        postedAt: new Date('2026-04-20'),
        amount: 500,
        description: 'zenith studios payout',
      }),
    ];
    const c = computeInflowConcentration(rows, now, 90);
    expect(c.totalInflowUsd).toBe(1000);
    expect(c.herfindahlIndex).toBeCloseTo(0.5, 5);
    expect(c.topSources).toHaveLength(2);
  });
});
