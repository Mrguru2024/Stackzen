import { FinancialTransactionDirection, JobStatus } from '@prisma/client';
import { addDays, addMonths, startOfDay } from 'date-fns';
import { prisma } from '@/lib/prisma';
import { MAX_TRANSACTION_ROWS, TRANSACTION_LOOKBACK_DAYS } from '@/lib/cashflow/constants';
import { detectRecurringPatterns } from '@/lib/cashflow/recurrence';
import type {
  CadenceKind,
  CashflowEventDto,
  CashFlowForecastResponseDto,
  DailyBalancePointDto,
  DetectedSeriesDto,
  ForecastWindowResultDto,
} from '@/lib/cashflow/types';
import { buildExplainPayload } from '@/lib/cashflow/explain';
import { analyzeRisks } from '@/lib/cashflow/risk';

function normalizeBillFrequency(raw: string): CadenceKind {
  const f = raw.trim().toLowerCase();
  if (f.includes('bi') && f.includes('week')) return 'biweekly';
  if (f.includes('week')) return 'weekly';
  if (f.includes('quarter')) return 'quarterly';
  if (f.includes('month')) return 'monthly';
  return 'monthly';
}

function nextFromCadence(d: Date, cadence: CadenceKind): Date {
  switch (cadence) {
    case 'weekly':
      return addDays(d, 7);
    case 'biweekly':
      return addDays(d, 14);
    case 'monthly':
      return addMonths(d, 1);
    case 'quarterly':
      return addMonths(d, 3);
    default:
      return addMonths(d, 1);
  }
}

function rollBillStart(billNext: Date, cadence: CadenceKind, rangeStart: Date): Date {
  let d = startOfDay(billNext);
  const rs = startOfDay(rangeStart);
  let guard = 0;
  while (d < rs && guard < 400) {
    d = startOfDay(nextFromCadence(d, cadence));
    guard += 1;
  }
  return d;
}

function enumerateOccurrencesInWindow(
  firstInWindow: Date,
  cadence: CadenceKind,
  windowEnd: Date
): Date[] {
  const out: Date[] = [];
  let d = startOfDay(firstInWindow);
  const end = startOfDay(windowEnd);
  let guard = 0;
  while (d <= end && guard < 400) {
    out.push(d);
    d = startOfDay(nextFromCadence(d, cadence));
    guard += 1;
  }
  return out;
}

function expandDetectedSeriesOccurrences(
  series: DetectedSeriesDto,
  rangeStart: Date,
  windowEnd: Date
): { at: Date; amount: number }[] {
  if (!series.nextExpectedDate || series.cadence === 'unknown') return [];
  const cadence = series.cadence;
  let cursor = startOfDay(new Date(series.nextExpectedDate));
  const rs = startOfDay(rangeStart);
  const we = startOfDay(windowEnd);
  let guard = 0;
  while (cursor < rs && guard < 120) {
    cursor = startOfDay(nextFromCadence(cursor, cadence));
    guard += 1;
  }
  const out: { at: Date; amount: number }[] = [];
  guard = 0;
  while (cursor <= we && guard < 400) {
    out.push({ at: cursor, amount: series.medianAmount });
    cursor = startOfDay(nextFromCadence(cursor, cadence));
    guard += 1;
  }
  return out;
}

async function loadStartingBalance(userId: string): Promise<number> {
  const accounts = await prisma.bankAccount.findMany({
    where: { userId, isActive: true },
    select: { availableBalance: true, currentBalance: true },
  });
  let sum = 0;
  for (const a of accounts) {
    const av = a.availableBalance;
    const cur = a.currentBalance;
    const pick =
      av != null && Number.isFinite(av)
        ? av
        : cur != null && Number.isFinite(cur)
          ? cur
          : 0;
    sum += Math.max(0, pick);
  }
  return sum;
}

async function loadWeeklyAllocationEstimate(userId: string, now: Date): Promise<number> {
  const since = addDays(now, -28);
  const agg = await prisma.smartAllocation.aggregate({
    where: { userId, createdAt: { gte: since } },
    _sum: { amount: true },
  });
  const total = agg._sum.amount ?? 0;
  return total / 4;
}

export async function buildCashFlowForecast(
  userId: string,
  opts: { includeDetails: boolean }
): Promise<CashFlowForecastResponseDto> {
  const now = new Date();
  const rangeStart = startOfDay(now);
  const lookback = addDays(now, -TRANSACTION_LOOKBACK_DAYS);

  const [transactions, recurringBills, invoices, depositPendingJobs] = await Promise.all([
    prisma.financialTransaction.findMany({
      where: { userId, postedAt: { gte: lookback } },
      orderBy: { postedAt: 'desc' },
      take: MAX_TRANSACTION_ROWS,
    }),
    prisma.recurringBill.findMany({
      where: { userId, enabled: true },
    }),
    prisma.invoice.findMany({
      where: {
        userId,
        status: { notIn: ['paid', 'failed'] },
      },
      select: {
        id: true,
        amount: true,
        dueDate: true,
        number: true,
        status: true,
      },
    }),
    prisma.job.count({
      where: { userId, status: JobStatus.DEPOSIT_PENDING },
    }),
  ]);

  const patterns = detectRecurringPatterns(transactions, now);
  const weeklyAlloc = await loadWeeklyAllocationEstimate(userId, now);
  const dailyAllocationDrag = weeklyAlloc / 7;

  const startingBalance = await loadStartingBalance(userId);

  const windows: ForecastWindowResultDto[] = ([7, 14, 30] as const).map(windowDays => {
    const windowEndInclusive = addDays(rangeStart, windowDays - 1);
    const events: CashflowEventDto[] = [];

    for (const bill of recurringBills) {
      const cadence = normalizeBillFrequency(bill.frequency);
      const startAt = rollBillStart(bill.nextDueDate, cadence, rangeStart);
      const dates = enumerateOccurrencesInWindow(startAt, cadence, windowEndInclusive);
      for (const dt of dates) {
        events.push({
          date: dt.toISOString(),
          amount: Math.abs(bill.amount),
          direction: FinancialTransactionDirection.OUTFLOW,
          kind: 'recurring_bill',
          label: bill.name,
          referenceIds: [bill.id],
        });
      }
    }

    for (const s of patterns.obligations) {
      for (const o of expandDetectedSeriesOccurrences(s, rangeStart, windowEndInclusive)) {
        events.push({
          date: o.at.toISOString(),
          amount: o.amount,
          direction: FinancialTransactionDirection.OUTFLOW,
          kind: 'detected_obligation',
          label: s.label,
          referenceIds: s.sampleTransactionIds.slice(0, 3),
        });
      }
    }

    for (const s of patterns.income) {
      for (const o of expandDetectedSeriesOccurrences(s, rangeStart, windowEndInclusive)) {
        events.push({
          date: o.at.toISOString(),
          amount: o.amount,
          direction: FinancialTransactionDirection.INFLOW,
          kind: 'detected_income',
          label: s.label,
          referenceIds: s.sampleTransactionIds.slice(0, 3),
        });
      }
    }

    for (const inv of invoices) {
      const due = startOfDay(inv.dueDate);
      if (due >= rangeStart && due <= windowEndInclusive) {
        events.push({
          date: due.toISOString(),
          amount: Math.abs(inv.amount),
          direction: FinancialTransactionDirection.INFLOW,
          kind: 'invoice_expected_payment',
          label: `Invoice ${inv.number} (${inv.status})`,
          referenceIds: [inv.id],
        });
      }
    }

    /** Allocation drag applied daily after cash events for that day. */
    let balance = startingBalance;
    let low = balance;
    let lowDate: Date | null = null;

    let expectedIncome = 0;
    let expectedBills = 0;

    const eventsByDay = new Map<string, CashflowEventDto[]>();
    for (const e of events) {
      const key = startOfDay(new Date(e.date)).toISOString();
      const arr = eventsByDay.get(key) ?? [];
      arr.push(e);
      eventsByDay.set(key, arr);
    }

    const dailySeries: DailyBalancePointDto[] = [];

    for (let i = 0; i < windowDays; i++) {
      const day = addDays(rangeStart, i);
      const key = startOfDay(day).toISOString();
      const dayEvents = eventsByDay.get(key) ?? [];

      for (const e of dayEvents) {
        if (e.direction === FinancialTransactionDirection.INFLOW) {
          balance += e.amount;
          expectedIncome += e.amount;
        } else {
          balance -= e.amount;
          expectedBills += e.amount;
        }
      }

      balance -= dailyAllocationDrag;
      if (balance < low) {
        low = balance;
        lowDate = day;
      }
      if (opts.includeDetails) {
        dailySeries.push({ date: day.toISOString(), balance });
      }
    }

    const endingBalance = balance;
    const allocationTotal = dailyAllocationDrag * windowDays;

    let riskLevel: ForecastWindowResultDto['riskLevel'] = 'low';
    if (low < 0 || low < startingBalance * 0.15) riskLevel = 'high';
    else if (low < startingBalance * 0.35) riskLevel = 'medium';

    return {
      windowDays,
      startingBalance,
      projectedEndingBalance: endingBalance,
      lowestProjectedBalance: low,
      lowestProjectedBalanceDate: lowDate ? lowDate.toISOString() : null,
      expectedIncomeTotal: expectedIncome,
      expectedBillsTotal: expectedBills,
      expectedAllocationImpactTotal: allocationTotal,
      riskLevel,
      events,
      daily: opts.includeDetails ? dailySeries : undefined,
    };
  });

  const risks = analyzeRisks({
    windows,
    weeklyAllocationEstimate: weeklyAlloc,
    startingBalance,
    depositPendingJobs,
  });

  const explain = buildExplainPayload({
    transactionRows: transactions.length,
    recurringBillRows: recurringBills.length,
    invoiceRows: invoices.length,
    patterns,
    startingBalance,
    weeklyAllocationEstimate: weeklyAlloc,
  });

  return {
    generatedAt: now.toISOString(),
    windows,
    recurringObligations: patterns.obligations,
    recurringIncome: patterns.income,
    risks,
    explain,
  };
}
