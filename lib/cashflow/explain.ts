import type { DetectedSeriesDto } from '@/lib/cashflow/types';

export function buildExplainPayload(input: {
  transactionRows: number;
  recurringBillRows: number;
  invoiceRows: number;
  patterns: { obligations: DetectedSeriesDto[]; income: DetectedSeriesDto[] };
  startingBalance: number;
  weeklyAllocationEstimate: number;
}): {
  assumptions: string[];
  inputsUsed: Record<string, number | string | string[]>;
  confidence: 'low' | 'medium' | 'high';
} {
  const assumptions = [
    'Dates use calendar-day buckets starting from today (UTC-based JavaScript Date math).',
    'Linked bank balances use each account max(availableBalance, currentBalance) floored at zero, summed.',
    'Recurrence patterns require ≥3 similar ledger rows with stable intervals; unknown cadences are excluded.',
    'Explicit RecurringBill rows override informal patterns when both exist—may double-count labels if names differ (review bills).',
    'Customer invoice receipts are modeled as inflows on invoice due dates while status remains unpaid—actual receipt timing may vary.',
    'Allocation pressure applies trailing 28-day SmartAllocation totals ÷4 as a weekly pace, spread evenly per day.',
    'Transfers detected via description keywords are excluded from recurrence clustering.',
  ];

  const patternConfidence =
    input.patterns.obligations.concat(input.patterns.income).reduce((m, p) => Math.max(m, p.confidence), 0);

  let confidence: 'low' | 'medium' | 'high' = 'low';
  if (patternConfidence >= 0.55 && input.transactionRows >= 40) confidence = 'medium';
  if (patternConfidence >= 0.7 && input.recurringBillRows >= 1) confidence = 'high';

  return {
    assumptions,
    inputsUsed: {
      ledgerRowsSampled: input.transactionRows,
      recurringBillCount: input.recurringBillRows,
      unpaidInvoiceCount: input.invoiceRows,
      detectedObligationPatterns: input.patterns.obligations.length,
      detectedIncomePatterns: input.patterns.income.length,
      startingBalanceUsd: input.startingBalance.toFixed(2),
      weeklyAllocationEstimateUsd: input.weeklyAllocationEstimate.toFixed(2),
      sampleTransactionIds: [
        ...input.patterns.obligations.flatMap(o => o.sampleTransactionIds),
        ...input.patterns.income.flatMap(i => i.sampleTransactionIds),
      ].slice(0, 24),
    },
    confidence,
  };
}
