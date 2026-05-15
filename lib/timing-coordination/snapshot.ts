import { differenceInCalendarDays, startOfDay } from 'date-fns';
import { OperationalGoalKind, OperationalGoalStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { buildCashFlowForecast } from '@/lib/cashflow/forecast';
import type { CashFlowForecastResponseDto } from '@/lib/cashflow/types';
import type { ContractorFinancialOpsSnapshotDto } from '@/lib/contractor-operations/types';
import {
  DEFAULT_BAND_DAYS,
  DEFAULT_CONFLICT_WINDOW_DAYS,
  DEFAULT_INSTABILITY_FRACTION,
  DEFAULT_MIN_CLUSTER_AMOUNT_USD,
  DEFAULT_MIN_CLUSTER_SIZE,
  DEFAULT_MIN_CONFLICT_DEFICIT_USD,
  DEFAULT_MIN_INSTABILITY_DAYS,
  detectInstabilityWindow,
  detectObligationClusters,
  detectPayoutBillConflicts,
} from '@/lib/timing-coordination/clusters';
import { buildCalendarEntries } from '@/lib/timing-coordination/calendar-entries';
import {
  buildTimingGuidance,
  buildTimingPressureFactors,
  isElevatedTimingPressure,
  timingPressureScore,
} from '@/lib/timing-coordination/pressure';
import type {
  ReservePrepGoalRefDto,
  TimingCoordinationSnapshotDto,
} from '@/lib/timing-coordination/types';

const RESERVE_PREP_LOOKAHEAD_DAYS = 7;
const RESERVE_PREP_MIN_PROGRESS = 0.5;
const RESERVE_GOAL_KINDS: ReadonlySet<OperationalGoalKind> = new Set([
  OperationalGoalKind.EMERGENCY_FUND,
  OperationalGoalKind.TAX_RESERVE,
]);

export interface BuildTimingCoordinationSnapshotOptions {
  /** Reuse an already-built forecast (hub bundle path). */
  forecast?: CashFlowForecastResponseDto;
  /** Optional contractor snapshot — feeds CONTRACTOR_PAYOUT_OVERLAP factor without extra queries. */
  contractor?: ContractorFinancialOpsSnapshotDto;
}

interface ReserveCandidate {
  goalId: string;
  name: string;
  goalKind: OperationalGoalKind;
  progress: number;
}

async function loadReserveCandidates(userId: string): Promise<ReserveCandidate[]> {
  const rows = await prisma.operationalGoal.findMany({
    where: {
      userId,
      status: OperationalGoalStatus.ACTIVE,
      goalKind: { in: Array.from(RESERVE_GOAL_KINDS) },
    },
    include: { smartBucket: true },
  });
  return rows.map(row => {
    const target = Number(row.targetAmount ?? 0);
    const current = Number(row.smartBucket?.currentAmount ?? 0);
    const progress = target > 0 ? Math.min(1, Math.max(0, current / target)) : 0;
    return {
      goalId: row.id,
      name: row.name,
      goalKind: row.goalKind,
      progress,
    };
  });
}

export interface TimingCoordinationSnapshotBundleInput {
  userId: string;
  forecast: CashFlowForecastResponseDto;
  contractor?: ContractorFinancialOpsSnapshotDto;
}

/**
 * Pure-ish: heavy IO inside (Prisma reads for invoices, goals, recurring bills)
 * but the forecast is supplied by the caller so the hub does NOT recompute it.
 */
export async function buildTimingCoordinationSnapshotFromForecast(
  input: TimingCoordinationSnapshotBundleInput
): Promise<TimingCoordinationSnapshotDto> {
  const { userId, forecast, contractor } = input;
  const now = new Date();
  const today = startOfDay(now);

  const window30 = forecast.windows.find(w => w.windowDays === 30) ?? forecast.windows[forecast.windows.length - 1];
  const events30 = window30?.events ?? [];
  const daily30 = window30?.daily;
  const startingBalance = window30?.startingBalance ?? 0;

  const clusters = detectObligationClusters(events30, {
    startingBalance,
  });
  const conflicts = detectPayoutBillConflicts(events30);
  const detailedForecast =
    daily30 && daily30.length > 0
      ? forecast
      : await buildCashFlowForecast(userId, { includeDetails: true });
  const dailySeries =
    daily30 && daily30.length > 0
      ? daily30
      : detailedForecast.windows.find(w => w.windowDays === 30)?.daily;
  const instabilityWindow = detectInstabilityWindow(dailySeries, {
    startingBalance,
  });

  const [recurringBills, invoiceRows, goalTargets, reserveCandidates] = await Promise.all([
    prisma.recurringBill.findMany({
      where: { userId, enabled: true },
      select: { id: true },
    }),
    prisma.invoice.findMany({
      where: { userId, status: { notIn: ['paid', 'failed'] } },
      select: { id: true, number: true, status: true, dueDate: true, amount: true },
    }),
    prisma.operationalGoal.findMany({
      where: { userId, status: OperationalGoalStatus.ACTIVE, targetDate: { not: null } },
      select: { id: true, name: true, targetDate: true },
    }),
    loadReserveCandidates(userId),
  ]);

  const earliestCluster = clusters[0];
  const reservePrepGoals: ReservePrepGoalRefDto[] = [];
  if (earliestCluster) {
    const diff = differenceInCalendarDays(new Date(earliestCluster.startDate), today);
    if (diff >= 0 && diff <= RESERVE_PREP_LOOKAHEAD_DAYS) {
      for (const goal of reserveCandidates) {
        if (goal.progress < RESERVE_PREP_MIN_PROGRESS) {
          reservePrepGoals.push({
            goalId: goal.goalId,
            name: goal.name,
            goalKind: goal.goalKind,
            progress: Number(goal.progress.toFixed(3)),
          });
        }
      }
    }
  }

  const contractorLatePayerClientCount = contractor?.latePayerClients?.length ?? 0;

  const factors = buildTimingPressureFactors({
    clusters,
    conflicts,
    instabilityWindow,
    reservePrepGoals,
    contractorLatePayerClientCount,
  });

  const score = timingPressureScore(factors);
  const hasDenseCluster = clusters.some(c => c.dense);
  const hasReservePrepBehind = reservePrepGoals.length > 0;

  const guidance = buildTimingGuidance({ factors, clusters, conflicts, reservePrepGoals });

  const calendarEntries = buildCalendarEntries({
    forecastEvents30d: events30,
    goalTargets: goalTargets
      .filter(g => g.targetDate)
      .map(g => ({
        goalId: g.id,
        name: g.name,
        targetDate: g.targetDate!.toISOString(),
      })),
    invoiceRows: invoiceRows.map(inv => ({
      id: inv.id,
      number: inv.number,
      status: inv.status,
      dueDate: inv.dueDate.toISOString(),
      amount: inv.amount,
    })),
    recurringBillIds: new Set(recurringBills.map(b => b.id)),
    clusters,
  });

  return {
    generatedAt: now.toISOString(),
    pressureScore: score,
    factors,
    clusters,
    conflicts,
    instabilityWindow,
    reservePrepGoals,
    guidance,
    calendarEntries,
    explain: {
      assumptions: [
        `Cluster detection uses bandDays=${DEFAULT_BAND_DAYS}, minSize=${DEFAULT_MIN_CLUSTER_SIZE}, minAmountUsd=${DEFAULT_MIN_CLUSTER_AMOUNT_USD} from the 30-day forecast OUTFLOW events only — no transaction re-detection.`,
        `Payout-bill conflict compares cumulative INFLOW vs cumulative OUTFLOW per day for the first ${DEFAULT_CONFLICT_WINDOW_DAYS} days; deficit ≥ $${DEFAULT_MIN_CONFLICT_DEFICIT_USD} is reported.`,
        `Instability window is the longest run of days with projected balance < ${(DEFAULT_INSTABILITY_FRACTION * 100).toFixed(0)}% of starting balance, minimum ${DEFAULT_MIN_INSTABILITY_DAYS} days.`,
        `Reserve-prep factor only fires when a cluster falls within ${RESERVE_PREP_LOOKAHEAD_DAYS} days AND a reserve goal exists with progress < ${(RESERVE_PREP_MIN_PROGRESS * 100).toFixed(0)}%.`,
        'Calendar entries are taken only from the 30-day forecast window (forecast.windows[2]) to avoid duplication across the 7/14/30 windows.',
        'Pressure score is factor count; never a percentage or weighted health index.',
        'Drag-and-drop of recurring-bill chips creates a SHIFT_RECURRING_BILL_DATE proposal via lib/operational-actions; nothing mutates without explicit preview/apply.',
        'Google Calendar connection is a read-only HMAC-signed ICS feed; no OAuth tokens are stored.',
      ],
      inputsUsed: {
        forecastGeneratedAt: forecast.generatedAt,
        startingBalanceUsd: Number(startingBalance.toFixed(2)),
        clusterCount: clusters.length,
        denseClusterCount: clusters.filter(c => c.dense).length,
        conflictCount: conflicts.length,
        instabilityDays: instabilityWindow?.daysCount ?? 0,
        reservePrepGoalCount: reservePrepGoals.length,
        contractorLatePayerClientCount,
        recurringBillCount: recurringBills.length,
        invoiceRowCount: invoiceRows.length,
        goalTargetCount: goalTargets.length,
        factorCount: score,
        elevatedAttention: isElevatedTimingPressure({
          factorsLen: score,
          hasDenseCluster,
          hasReservePrepBehind,
        }),
        calendarEntryCount: calendarEntries.length,
      },
    },
  };
}

export async function buildTimingCoordinationSnapshot(
  userId: string,
  opts: BuildTimingCoordinationSnapshotOptions = {}
): Promise<TimingCoordinationSnapshotDto> {
  const forecast = opts.forecast ?? (await buildCashFlowForecast(userId, { includeDetails: true }));
  return buildTimingCoordinationSnapshotFromForecast({
    userId,
    forecast,
    contractor: opts.contractor,
  });
}
