import {
  FinancialEntityType,
  FinancialEventType,
  FinancialEventSource,
  Prisma,
} from '@prisma/client';
import { prisma } from '@/lib/prisma';

export type FinancialTimelineFilters = {
  types?: FinancialEventType[];
  sources?: FinancialEventSource[];
  relatedEntityType?: FinancialEntityType;
  /** Scope events to one job: JOB entity rows or metadata.jobId (invoices, quotes, expenses). */
  jobId?: string;
  limit?: number;
  cursor?: string;
};

export async function getFinancialTimeline(userId: string, filters: FinancialTimelineFilters = {}) {
  const limit = Math.min(Math.max(filters.limit ?? 50, 1), 200);

  const jobScope: Prisma.FinancialEventWhereInput | undefined = filters.jobId
    ? {
        OR: [
          {
            relatedEntityType: FinancialEntityType.JOB,
            relatedEntityId: filters.jobId,
          },
          {
            metadata: {
              path: ['jobId'],
              equals: filters.jobId,
            },
          },
        ],
      }
    : undefined;

  const events = await prisma.financialEvent.findMany({
    where: {
      userId,
      ...(jobScope ?? {}),
      ...(filters.types?.length ? { type: { in: filters.types } } : {}),
      ...(filters.sources?.length ? { source: { in: filters.sources } } : {}),
      ...(filters.relatedEntityType ? { relatedEntityType: filters.relatedEntityType } : {}),
    },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: limit,
    ...(filters.cursor
      ? {
          cursor: { id: filters.cursor },
          skip: 1,
        }
      : {}),
  });

  const nextCursor = events.length === limit ? events.at(-1)?.id ?? null : null;
  return { events, nextCursor };
}

