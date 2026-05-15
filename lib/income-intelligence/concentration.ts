import type { FinancialTransaction } from '@prisma/client';
import { FinancialTransactionDirection } from '@prisma/client';
import { addDays, startOfDay } from 'date-fns';
import { isTransferDescription } from '@/lib/financial-automation/transactions';
import { buildRecurringSeriesKey } from '@/lib/cashflow/recurrence';
import type { IncomeConcentrationDto, IncomeSourceShareDto } from '@/lib/income-intelligence/types';

export function computeInflowConcentration(
  rows: FinancialTransaction[],
  now: Date,
  windowDays: number
): IncomeConcentrationDto {
  const dayStart = startOfDay(now);
  const windowStart = addDays(dayStart, -windowDays);

  const sums = new Map<string, { label: string; total: number; sampleIds: string[] }>();

  for (const tx of rows) {
    if (tx.direction !== FinancialTransactionDirection.INFLOW) continue;
    if (isTransferDescription(tx.description)) continue;
    if (Math.abs(tx.amount) <= 0) continue;
    const posted = startOfDay(tx.postedAt);
    if (posted < windowStart || posted > dayStart) continue;

    const key = buildRecurringSeriesKey(FinancialTransactionDirection.INFLOW, tx);
    const label = (tx.merchantName?.trim() || tx.description.trim()).slice(0, 80);
    const cur = sums.get(key);
    const amt = Math.abs(tx.amount);
    if (!cur) {
      sums.set(key, { label, total: amt, sampleIds: [tx.id] });
    } else {
      cur.total += amt;
      if (cur.sampleIds.length < 5 && !cur.sampleIds.includes(tx.id)) cur.sampleIds.push(tx.id);
    }
  }

  let totalInflowUsd = 0;
  for (const v of sums.values()) totalInflowUsd += v.total;

  const topSources: IncomeSourceShareDto[] = [];
  if (totalInflowUsd > 0) {
    const ranked = [...sums.entries()]
      .map(([seriesKey, v]) => ({
        seriesKey,
        label: v.label,
        totalUsd: v.total,
        shareOfTotal: v.total / totalInflowUsd,
        transactionIdsSample: v.sampleIds,
      }))
      .sort((a, b) => b.totalUsd - a.totalUsd)
      .slice(0, 8);
    topSources.push(...ranked);
  }

  let herfindahlIndex = 0;
  if (totalInflowUsd > 0) {
    for (const v of sums.values()) {
      const s = v.total / totalInflowUsd;
      herfindahlIndex += s * s;
    }
  }

  const reasoning: string[] = [
    `Concentration uses non-transfer INFLOW rows in FinancialTransaction for the last ${windowDays} calendar days (local day boundaries, same basis as Cash Flow).`,
    'Each bucket shares the same normalized merchant/description grouping key as Cash Flow recurring income detection.',
  ];
  if (totalInflowUsd <= 0) {
    reasoning.push('No qualifying inflows in window — concentration metrics are undefined.');
  }

  return {
    windowDays,
    totalInflowUsd,
    herfindahlIndex,
    topSources,
    reasoning,
  };
}

export function computeAmountCoefficientOfVariation(amounts: number[]): number | null {
  if (amounts.length < 3) return null;
  const vals = amounts.map(a => Math.abs(a));
  const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
  if (mean <= 0) return null;
  const variance = vals.reduce((acc, x) => acc + (x - mean) ** 2, 0) / vals.length;
  const sd = Math.sqrt(variance);
  return sd / mean;
}
