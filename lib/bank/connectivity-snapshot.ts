import {
  BankConnectionStatus,
  BankSyncJobStatus,
  FinancialTransactionDirection,
  FinancialTransactionSource,
} from '@prisma/client';
import { differenceInHours } from 'date-fns';
import { prisma } from '@/lib/prisma';
import {
  NEVER_SYNCED_MIN_AGE_HOURS,
  RECENT_INFLOW_WINDOW_DAYS,
  STALE_SYNC_HOURS,
} from '@/lib/bank/connectivity-constants';

export type ConnectivityStalenessLabel =
  | 'healthy'
  | 'reconnect_required'
  | 'post_error'
  | 'never_synced'
  | 'sync_stale';

export type BankConnectionHealthSnapshot = {
  connectionId: string;
  institutionName: string | null;
  status: BankConnectionStatus;
  provider: string;
  lastSuccessfulSyncAt: string | null;
  lastSyncErrorAt: string | null;
  syncErrorCode: string | null;
  hoursSinceLastSuccess: number | null;
  staleness: ConnectivityStalenessLabel;
  latestJob: {
    id: string;
    status: BankSyncJobStatus;
    attemptCount: number;
    completedAt: string | null;
    errorCode: string | null;
    errorMessage: string | null;
  } | null;
  activeAccountCount: number;
  latestIngestedPostedAt: string | null;
  recentPlaidInflowCount14d: number;
  recentPlaidInflowSum14d: number;
};

export type ConnectivitySnapshotDto = {
  generatedAt: string;
  connections: BankConnectionHealthSnapshot[];
};

export function classifyConnectionStaleness(input: {
  status: BankConnectionStatus;
  lastSuccessfulSyncAt: Date | null;
  lastSyncErrorAt: Date | null;
  connectionCreatedAt: Date;
}): ConnectivityStalenessLabel {
  const { status, lastSuccessfulSyncAt, lastSyncErrorAt, connectionCreatedAt } = input;
  if (status !== BankConnectionStatus.ACTIVE) {
    return 'reconnect_required';
  }
  const now = new Date();
  if (
    lastSyncErrorAt &&
    (!lastSuccessfulSyncAt || lastSyncErrorAt.getTime() > lastSuccessfulSyncAt.getTime())
  ) {
    return 'post_error';
  }
  if (!lastSuccessfulSyncAt) {
    const ageH = differenceInHours(now, connectionCreatedAt);
    if (ageH >= NEVER_SYNCED_MIN_AGE_HOURS) return 'never_synced';
    return 'healthy';
  }
  const hours = differenceInHours(now, lastSuccessfulSyncAt);
  if (hours >= STALE_SYNC_HOURS) return 'sync_stale';
  return 'healthy';
}

export async function buildConnectivitySnapshot(userId: string): Promise<ConnectivitySnapshotDto> {
  const generatedAt = new Date().toISOString();
  const sinceInflow = new Date();
  sinceInflow.setDate(sinceInflow.getDate() - RECENT_INFLOW_WINDOW_DAYS);

  const connections = await prisma.bankConnection.findMany({
    where: { userId },
    select: {
      id: true,
      institutionName: true,
      status: true,
      provider: true,
      lastSuccessfulSyncAt: true,
      lastSyncErrorAt: true,
      syncErrorCode: true,
      createdAt: true,
      bankAccounts: { where: { isActive: true }, select: { id: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

  const rows: BankConnectionHealthSnapshot[] = [];

  for (const c of connections) {
    const accountIds = c.bankAccounts.map(a => a.id);
    const [latestJob, maxPosted, inflowStats] = await Promise.all([
      prisma.bankSyncJob.findFirst({
        where: { bankConnectionId: c.id },
        orderBy: [{ completedAt: 'desc' }, { createdAt: 'desc' }],
      }),
      accountIds.length
        ? prisma.financialTransaction.aggregate({
            where: { userId, bankAccountId: { in: accountIds } },
            _max: { postedAt: true },
          })
        : Promise.resolve({ _max: { postedAt: null as Date | null } }),
      accountIds.length
        ? Promise.all([
            prisma.financialTransaction.count({
              where: {
                userId,
                bankAccountId: { in: accountIds },
                source: FinancialTransactionSource.PLAID_SYNC,
                direction: FinancialTransactionDirection.INFLOW,
                postedAt: { gte: sinceInflow },
              },
            }),
            prisma.financialTransaction.aggregate({
              where: {
                userId,
                bankAccountId: { in: accountIds },
                source: FinancialTransactionSource.PLAID_SYNC,
                direction: FinancialTransactionDirection.INFLOW,
                postedAt: { gte: sinceInflow },
              },
              _sum: { amount: true },
            }),
          ]).then(([cnt, sum]) => ({ count: cnt, sum: sum._sum.amount ?? 0 }))
        : Promise.resolve({ count: 0, sum: 0 }),
    ]);

    const staleness = classifyConnectionStaleness({
      status: c.status,
      lastSuccessfulSyncAt: c.lastSuccessfulSyncAt,
      lastSyncErrorAt: c.lastSyncErrorAt,
      connectionCreatedAt: c.createdAt,
    });

    const hoursSinceLastSuccess =
      c.lastSuccessfulSyncAt != null ? differenceInHours(new Date(), c.lastSuccessfulSyncAt) : null;

    rows.push({
      connectionId: c.id,
      institutionName: c.institutionName,
      status: c.status,
      provider: c.provider,
      lastSuccessfulSyncAt: c.lastSuccessfulSyncAt?.toISOString() ?? null,
      lastSyncErrorAt: c.lastSyncErrorAt?.toISOString() ?? null,
      syncErrorCode: c.syncErrorCode,
      hoursSinceLastSuccess,
      staleness,
      latestJob: latestJob
        ? {
            id: latestJob.id,
            status: latestJob.status,
            attemptCount: latestJob.attemptCount,
            completedAt: latestJob.completedAt?.toISOString() ?? null,
            errorCode: latestJob.errorCode,
            errorMessage: latestJob.errorMessage,
          }
        : null,
      activeAccountCount: accountIds.length,
      latestIngestedPostedAt: maxPosted._max.postedAt?.toISOString() ?? null,
      recentPlaidInflowCount14d: inflowStats.count,
      recentPlaidInflowSum14d: Number(inflowStats.sum.toFixed(2)),
    });
  }

  return { generatedAt, connections: rows };
}
