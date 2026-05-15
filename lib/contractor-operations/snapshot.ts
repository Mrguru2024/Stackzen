import { differenceInCalendarDays } from 'date-fns';
import {
  JobDepositStatus,
  JobStatus,
  OperationalGoalKind,
  OperationalGoalStatus,
} from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { buildCashFlowForecast } from '@/lib/cashflow/forecast';
import type { CashFlowForecastResponseDto } from '@/lib/cashflow/types';
import {
  summarizeLatePayersByClient,
  summarizeUpcomingDueSpread,
} from '@/lib/contractor-operations/collection-intelligence';
import { computeReceivableConcentration } from '@/lib/contractor-operations/receivable';
import type {
  CollectionTimingDto,
  ContractorFinancialOpsExplainDto,
  ContractorFinancialOpsSnapshotDto,
  ContractorReserveNudgeDto,
  JobCashSnapshotDto,
  LatePayerClientDto,
  MaterialExposureJobDto,
  NegativeMarginJobDto,
  OpenReceivableDto,
  ReceivableConcentrationDto,
} from '@/lib/contractor-operations/types';

const MATERIAL_EPS = 0.01;
const PROFIT_EPS = 0.01;
const MAX_JOBS = 40;
const MAX_OPEN_INV = 80;

const NEGATIVE_MARGIN_STATUSES: JobStatus[] = [
  JobStatus.APPROVED,
  JobStatus.DEPOSIT_PENDING,
  JobStatus.IN_PROGRESS,
  JobStatus.AWAITING_PAYMENT,
];

function isDepositGateOpen(status: JobDepositStatus): boolean {
  return status === JobDepositStatus.REQUIRED_UNPAID || status === JobDepositStatus.PARTIALLY_PAID;
}

export async function buildContractorFinancialOpsSnapshot(
  userId: string,
  opts?: { forecast?: CashFlowForecastResponseDto }
): Promise<ContractorFinancialOpsSnapshotDto> {
  const now = new Date();
  const forecastPromise = opts?.forecast
    ? Promise.resolve(opts.forecast)
    : buildCashFlowForecast(userId, { includeDetails: false });

  const [jobs, openInvoices, forecast, taxReserveGoalCount] = await Promise.all([
    prisma.job.findMany({
      where: { userId },
      select: {
        id: true,
        title: true,
        status: true,
        clientId: true,
        depositStatus: true,
        depositPaid: true,
        jobRevenue: true,
        jobExpenses: true,
        estimatedProfit: true,
        estimatedAmount: true,
      },
      orderBy: { updatedAt: 'desc' },
      take: MAX_JOBS,
    }),
    prisma.invoice.findMany({
      where: { userId, status: { notIn: ['paid', 'failed'] } },
      select: { id: true, number: true, clientId: true, amount: true, dueDate: true, jobId: true },
      orderBy: { dueDate: 'asc' },
      take: MAX_OPEN_INV,
    }),
    forecastPromise,
    prisma.operationalGoal.count({
      where: {
        userId,
        status: OperationalGoalStatus.ACTIVE,
        goalKind: OperationalGoalKind.TAX_RESERVE,
      },
    }),
  ]);

  const hasContractorContext = jobs.length > 0 || openInvoices.length > 0;

  const jobsSample: JobCashSnapshotDto[] = jobs.map(j => ({
    jobId: j.id,
    title: j.title,
    status: j.status,
    clientId: j.clientId,
    depositStatus: j.depositStatus,
    depositPaid: j.depositPaid,
    jobRevenue: j.jobRevenue,
    jobExpenses: j.jobExpenses,
    estimatedProfit: j.estimatedProfit ?? 0,
    estimatedAmount: j.estimatedAmount,
  }));

  const materialExposure: MaterialExposureJobDto[] = [];
  for (const j of jobs) {
    if (!isDepositGateOpen(j.depositStatus)) continue;
    if (j.jobExpenses <= j.depositPaid + MATERIAL_EPS) continue;
    const exposureUsd = j.jobExpenses - j.depositPaid;
    materialExposure.push({
      jobId: j.id,
      title: j.title,
      clientId: j.clientId,
      depositPaid: j.depositPaid,
      jobExpenses: j.jobExpenses,
      exposureUsd,
      reasoning: [
        'Deposit gate is not fully satisfied (REQUIRED_UNPAID or PARTIALLY_PAID).',
        `Recorded job expenses ($${j.jobExpenses.toFixed(2)}) exceed deposit collected ($${j.depositPaid.toFixed(2)}) on the Job row (from Expense + paid invoice rollup in recomputeJobRevenue).`,
      ],
    });
  }
  materialExposure.sort((a, b) => b.exposureUsd - a.exposureUsd);

  const negativeMarginJobs: NegativeMarginJobDto[] = [];
  for (const j of jobs) {
    if (!NEGATIVE_MARGIN_STATUSES.includes(j.status)) continue;
    const profit = j.estimatedProfit ?? 0;
    if (profit >= -PROFIT_EPS) continue;
    negativeMarginJobs.push({
      jobId: j.id,
      title: j.title,
      clientId: j.clientId,
      estimatedProfit: profit,
      jobRevenue: j.jobRevenue,
      jobExpenses: j.jobExpenses,
      reasoning: [
        'estimatedProfit = jobRevenue − jobExpenses on the Job model, recomputed when invoices/expenses change.',
        `Only active lifecycle statuses (${NEGATIVE_MARGIN_STATUSES.join(', ')}) are considered.`,
      ],
    });
  }
  negativeMarginJobs.sort((a, b) => a.estimatedProfit - b.estimatedProfit);

  const openReceivables: OpenReceivableDto[] = openInvoices.map(inv => {
    const due = inv.dueDate;
    const past = due < now;
    const daysPastDue = past ? differenceInCalendarDays(now, due) : null;
    return {
      invoiceId: inv.id,
      number: inv.number,
      clientId: inv.clientId,
      amount: inv.amount,
      dueDate: due.toISOString(),
      daysPastDue,
      jobId: inv.jobId,
    };
  });

  const conc = computeReceivableConcentration(
    openInvoices.map(i => ({ invoiceId: i.id, clientId: i.clientId, amount: i.amount }))
  );

  const receivableConcentration: ReceivableConcentrationDto = {
    openInvoiceCount: openInvoices.length,
    totalOpenUsd: conc.totalOpenUsd,
    herfindahlIndex: conc.herfindahlIndex,
    topClients: conc.topClients,
    reasoning: [
      'Concentration uses unpaid invoices only (status not paid/failed), grouped by clientId.',
      'Herfindahl index = sum of squared share of open receivable amounts per client.',
    ],
  };

  const latePayerRows = openReceivables.map(r => ({
    clientId: r.clientId,
    invoiceId: r.invoiceId,
    amount: r.amount,
    daysPastDue: r.daysPastDue,
  }));
  const latePayerClients: LatePayerClientDto[] = summarizeLatePayersByClient(latePayerRows);

  const spread = summarizeUpcomingDueSpread(
    openInvoices.map(i => ({ dueDate: i.dueDate })),
    now,
    14
  );
  const collectionTiming: CollectionTimingDto = {
    windowDays: 14,
    upcomingWithinWindowCount: spread.upcomingWithinWindowCount,
    meanDaysUntilDue: spread.meanDaysUntilDue,
    stdevDaysUntilDue: spread.stdevDaysUntilDue,
    reasoning: spread.reasoning,
  };

  const forecastRiskCodes = forecast.risks.map(r => r.code);
  const reserveNudges: ContractorReserveNudgeDto[] = [];
  const cashPressure = forecastRiskCodes.some(c =>
    ['PROJECTED_LOW_BALANCE', 'ALLOCATION_PRESSURE'].includes(c)
  );
  if (cashPressure && (materialExposure.length > 0 || negativeMarginJobs.length > 0)) {
    reserveNudges.push({
      code: 'CASHFLOW_PRESSURE_WITH_JOB_RISK',
      summary: 'Personal cashflow pressure overlaps with job-side exposure',
      detail:
        'Tighten contractor job spend, collect deposits/invoices before new material purchases, and align operational goals with Cash Flow.',
      reasoning: [
        `Active forecast risk codes include: ${forecastRiskCodes.filter(c => ['PROJECTED_LOW_BALANCE', 'ALLOCATION_PRESSURE'].includes(c)).join(', ') || '(none)'}.`,
        `Material exposure jobs: ${materialExposure.length}; negative margin jobs (active statuses): ${negativeMarginJobs.length}.`,
      ],
    });
  }
  if (openInvoices.length >= 2 && conc.herfindahlIndex >= 0.5) {
    reserveNudges.push({
      code: 'RECEIVABLE_CONCENTRATION_BUFFER',
      summary: 'Open receivables are concentrated with one payer',
      detail:
        'A single late client disproportionately affects liquidity. Pair invoice follow-ups with Cash Flow timing review.',
      reasoning: [
        `Herfindahl index on open receivables = ${conc.herfindahlIndex.toFixed(3)} (warn ≥ 0.5 with ≥2 open invoices).`,
      ],
    });
  }
  if (
    taxReserveGoalCount === 0 &&
    jobs.length > 0 &&
    (latePayerClients.length > 0 || forecastRiskCodes.includes('INVOICE_RECEIVABLE_GAP'))
  ) {
    reserveNudges.push({
      code: 'TAX_RESERVE_SUGGESTED',
      summary: 'Consider an explicit tax reserve operational goal',
      detail:
        'With job-linked receivable stress and no active TAX_RESERVE operational goal, irregular contractor inflows are harder to segregate from spend. Use Operational Goals (tax reserve template) so SmartAllocation pacing stays auditable.',
      reasoning: [
        `Active TAX_RESERVE goals: ${taxReserveGoalCount}.`,
        `Late-payer client groups (overdue open AR): ${latePayerClients.length}.`,
        `INVOICE_RECEIVABLE_GAP in forecast: ${forecastRiskCodes.includes('INVOICE_RECEIVABLE_GAP') ? 'yes' : 'no'}.`,
      ],
    });
  }

  const explain: ContractorFinancialOpsExplainDto = {
    assumptions: [
      'Job P&L fields are maintained by lib/jobs/revenue.recomputeJobRevenue — this snapshot does not re-implement profitability math.',
      'Material exposure is a deposit-coverage operational heuristic, not GAAP cost recognition.',
      'Late payer stats use only open invoices already past due (daysPastDue > 0), grouped by clientId with amount-weighted lateness.',
      'Collection timing spread uses unpaid invoices with dueDate strictly after today and on or before today+windowDays (calendar-day math).',
    ],
    inputsUsed: {
      jobRows: jobs.length,
      openInvoiceRows: openInvoices.length,
      maxJobsSampled: MAX_JOBS,
      maxOpenInvoicesSampled: MAX_OPEN_INV,
      taxReserveGoalCount,
      latePayerClientGroups: latePayerClients.length,
    },
  };

  return {
    generatedAt: now.toISOString(),
    hasContractorContext,
    jobsSample,
    materialExposure,
    negativeMarginJobs,
    openReceivables,
    receivableConcentration,
    latePayerClients,
    collectionTiming,
    reserveNudges,
    forecastRiskCodes,
    explain,
  };
}
