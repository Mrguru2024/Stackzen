import type { FinancialTransaction } from '@prisma/client';
import { FinancialTransactionDirection } from '@prisma/client';
import { addDays, differenceInCalendarDays, startOfDay } from 'date-fns';
import { prisma } from '@/lib/prisma';
import { MAX_TRANSACTION_ROWS, TRANSACTION_LOOKBACK_DAYS } from '@/lib/cashflow/constants';
import { detectRecurringPatterns, buildRecurringSeriesKey } from '@/lib/cashflow/recurrence';
import { buildCashFlowForecast } from '@/lib/cashflow/forecast';
import { isTransferDescription } from '@/lib/financial-automation/transactions';
import {
  computeAmountCoefficientOfVariation,
  computeInflowConcentration,
} from '@/lib/income-intelligence/concentration';
import type { DetectedSeriesDto } from '@/lib/cashflow/types';
import type {
  DecliningPayoutSignalDto,
  DelayedIncomeSignalDto,
  IncomeIntelligenceExplainDto,
  IncomeIntelligenceSnapshotDto,
  IrregularPayoutSeriesDto,
  ReserveGuidanceNudgeDto,
} from '@/lib/income-intelligence/types';

const IRREGULAR_CONFIDENCE_MAX = 0.28;
const IRREGULAR_MIN_OCCURRENCES = 5;
const CONCENTRATION_HHI_WARN = 0.48;
const CONCENTRATION_TOP_SHARE_WARN = 0.58;
const DECLINE_RATIO = 0.88;

function txsForSeriesKey(rows: FinancialTransaction[], seriesKey: string): FinancialTransaction[] {
  return rows.filter(
    t =>
      t.direction === FinancialTransactionDirection.INFLOW &&
      !isTransferDescription(t.description) &&
      buildRecurringSeriesKey(FinancialTransactionDirection.INFLOW, t) === seriesKey
  );
}

function buildDecliningSignals(rows: FinancialTransaction[], recurringKeys: Set<string>): DecliningPayoutSignalDto[] {
  const out: DecliningPayoutSignalDto[] = [];
  for (const key of recurringKeys) {
    const txs = txsForSeriesKey(rows, key).sort((a, b) => a.postedAt.getTime() - b.postedAt.getTime());
    if (txs.length < 6) continue;
    const last3 = txs.slice(-3).map(t => Math.abs(t.amount));
    const prev3 = txs.slice(-6, -3).map(t => Math.abs(t.amount));
    const recentMed = median(last3);
    const priorMed = median(prev3);
    if (priorMed <= 0 || recentMed >= priorMed * DECLINE_RATIO) continue;
    const label = (txs[txs.length - 1].merchantName?.trim() || txs[txs.length - 1].description.trim()).slice(0, 80);
    out.push({
      seriesKey: key,
      label,
      recentMedianUsd: recentMed,
      priorMedianUsd: priorMed,
      sampleTransactionIds: txs.slice(-5).map(t => t.id),
      reasoning: [
        'Compared median absolute amount of the last three inflows vs the prior three for this recurring label group.',
        `Threshold: recent median < ${(DECLINE_RATIO * 100).toFixed(0)}% of prior median.`,
      ],
    });
  }
  return out;
}

function median(nums: number[]): number {
  if (nums.length === 0) return 0;
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid]! : (s[mid - 1]! + s[mid]!) / 2;
}

function buildDelayedSignals(recurringIncome: DetectedSeriesDto[], now: Date): DelayedIncomeSignalDto[] {
  const today = startOfDay(now);
  const out: DelayedIncomeSignalDto[] = [];
  for (const s of recurringIncome) {
    if (!s.nextExpectedDate) continue;
    const expectedDay = startOfDay(new Date(s.nextExpectedDate));
    if (expectedDay >= today) continue;
    const daysPastExpected = differenceInCalendarDays(today, expectedDay);
    out.push({
      seriesKey: s.key,
      label: s.label,
      cadence: s.cadence,
      medianAmountUsd: s.medianAmount,
      nextExpectedDate: s.nextExpectedDate,
      daysPastExpected,
      sampleTransactionIds: s.sampleTransactionIds,
      reasoning: [
        'Expected deposit date is derived from the same cadence + last posted inflow as Cash Flow recurring income.',
        `Calendar days past expected (local): ${daysPastExpected}.`,
      ],
    });
  }
  return out.sort((a, b) => b.daysPastExpected - a.daysPastExpected);
}

function buildIrregular(recurringIncome: DetectedSeriesDto[]): IrregularPayoutSeriesDto[] {
  return recurringIncome
    .filter(s => s.confidence < IRREGULAR_CONFIDENCE_MAX && s.occurrences >= IRREGULAR_MIN_OCCURRENCES)
    .map(s => ({
      series: s,
      reasoning: [
        'Irregularity uses the Cash Flow recurrence engine: confidence blends sample depth with interval stability (median absolute deviation vs median interval).',
        `This series is below the operational threshold (confidence < ${IRREGULAR_CONFIDENCE_MAX}, occurrences ≥ ${IRREGULAR_MIN_OCCURRENCES}).`,
      ],
    }));
}

function buildReserveNudges(input: {
  forecastRiskCodes: string[];
  concentrationHhi: number;
  topShare: number;
  delayedCount: number;
  irregularCount: number;
  evidenceIds: string[];
}): ReserveGuidanceNudgeDto[] {
  const nudges: ReserveGuidanceNudgeDto[] = [];
  const pressure = input.forecastRiskCodes.some(c =>
    ['PROJECTED_LOW_BALANCE', 'BILLS_BEFORE_NEXT_INCOME', 'DEPOSIT_RUNWAY_WARNING'].includes(c)
  );
  if (pressure) {
    nudges.push({
      code: 'FORECAST_PRESSURE',
      summary: 'Cash flow forecast flags balance or timing pressure',
      detail:
        'Extend liquid reserves or shift bill timing where possible. Review the same deterministic risks shown in Cash Flow — no separate “score”.',
      evidenceTransactionIds: input.evidenceIds.slice(0, 5),
      reasoning: [
        `Active forecast risk codes: ${input.forecastRiskCodes.length ? input.forecastRiskCodes.join(', ') : '(none)'}.`,
      ],
    });
  }
  if (input.concentrationHhi >= CONCENTRATION_HHI_WARN || input.topShare >= CONCENTRATION_TOP_SHARE_WARN) {
    nudges.push({
      code: 'CONCENTRATION_BUFFER',
      summary: 'Income is concentrated in few deposit labels',
      detail:
        'A larger cash buffer reduces operational fragility if a payer is late or an invoice slips. Concentration is computed from squared income shares on real ledger inflows.',
      evidenceTransactionIds: input.evidenceIds.slice(0, 5),
      reasoning: [
        `Herfindahl-style index (sum of squared shares) = ${input.concentrationHhi.toFixed(3)}; warn ≥ ${CONCENTRATION_HHI_WARN}.`,
        `Largest single-source share ≈ ${(input.topShare * 100).toFixed(1)}%; warn ≥ ${(CONCENTRATION_TOP_SHARE_WARN * 100).toFixed(0)}%.`,
      ],
    });
  }
  if (input.delayedCount > 0) {
    nudges.push({
      code: 'DELAYED_DEPOSIT_BUFFER',
      summary: 'At least one expected inflow is past its modeled date',
      detail:
        'Treat reserve targets as sensitive to timing drift until deposits realign with historical cadence. Confirm recent transactions in Money Control.',
      evidenceTransactionIds: input.evidenceIds.slice(0, 5),
      reasoning: [`${input.delayedCount} recurring income series(ies) have expected dates before today.`],
    });
  }
  if (input.irregularCount > 0) {
    nudges.push({
      code: 'IRREGULAR_PAYOUT_BUFFER',
      summary: 'Irregular payout intervals detected on recurring income',
      detail:
        'Volatile intervals widen the gap between “expected” and actual cash arrival. Prefer conservative reserve targets until intervals stabilize.',
      evidenceTransactionIds: input.evidenceIds.slice(0, 5),
      reasoning: [
        `${input.irregularCount} series(ies) fell below the recurrence confidence threshold while still showing a detectable cadence.`,
      ],
    });
  }
  return nudges;
}

export async function buildIncomeIntelligenceSnapshot(userId: string): Promise<IncomeIntelligenceSnapshotDto> {
  const now = new Date();
  const lookback = addDays(now, -TRANSACTION_LOOKBACK_DAYS);

  const [transactions, forecast] = await Promise.all([
    prisma.financialTransaction.findMany({
      where: { userId, postedAt: { gte: lookback } },
      orderBy: { postedAt: 'desc' },
      take: MAX_TRANSACTION_ROWS,
    }),
    buildCashFlowForecast(userId, { includeDetails: false }),
  ]);

  const patterns = detectRecurringPatterns(transactions, now);
  const concentration = computeInflowConcentration(transactions, now, 90);
  const delayedIncome = buildDelayedSignals(patterns.income, now);
  const irregularPayouts = buildIrregular(patterns.income);

  const recurringKeys = new Set(patterns.income.map(s => s.key));
  const decliningPayouts = buildDecliningSignals(transactions, recurringKeys);

  const forecastRiskCodes = forecast.risks.map(r => r.code);
  const topShare = concentration.topSources[0]?.shareOfTotal ?? 0;
  const evidenceIds = [
    ...new Set([
      ...delayedIncome.flatMap(d => d.sampleTransactionIds),
      ...concentration.topSources.flatMap(s => s.transactionIdsSample),
      ...irregularPayouts.flatMap(i => i.series.sampleTransactionIds),
    ]),
  ].slice(0, 12);

  const reserveNudges = buildReserveNudges({
    forecastRiskCodes,
    concentrationHhi: concentration.herfindahlIndex,
    topShare,
    delayedCount: delayedIncome.length,
    irregularCount: irregularPayouts.length,
    evidenceIds,
  });

  const amountCvByKey = new Map<string, number | null>();
  for (const s of patterns.income) {
    const txs = txsForSeriesKey(transactions, s.key).sort((a, b) => a.postedAt.getTime() - b.postedAt.getTime());
    const cv = computeAmountCoefficientOfVariation(txs.map(t => Math.abs(t.amount)));
    amountCvByKey.set(s.key, cv);
  }

  const explain: IncomeIntelligenceExplainDto = {
    assumptions: [
      'Uses FinancialTransaction as the canonical ledger; excludes rows classified as internal transfers by description heuristics.',
      'Recurring income series reuse lib/cashflow/recurrence detectRecurringPatterns — same inputs as Cash Flow forecast income events.',
      'No synthetic income score: signals are thresholds on ledger-backed statistics only.',
    ],
    inputsUsed: {
      transactionLookbackDays: TRANSACTION_LOOKBACK_DAYS,
      transactionRowCount: transactions.length,
      recurringIncomeSeriesCount: patterns.income.length,
      concentrationWindowDays: 90,
    },
    confidenceNotes: [
      'Recurrence “confidence” is the same deterministic blend used in Cash Flow (sample size × interval stability).',
      ...patterns.income.slice(0, 5).map(s => {
        const cv = amountCvByKey.get(s.key);
        const cvNote = cv == null ? 'n/a' : cv.toFixed(2);
        return `${s.label}: cadence=${s.cadence}, recurrenceConfidence=${s.confidence.toFixed(2)}, amountCv=${cvNote}`;
      }),
    ],
  };

  return {
    generatedAt: now.toISOString(),
    lookbackDays: TRANSACTION_LOOKBACK_DAYS,
    recurringIncome: patterns.income,
    concentration,
    delayedIncome,
    irregularPayouts,
    decliningPayouts,
    reserveNudges,
    forecastRiskCodes,
    explain,
  };
}
