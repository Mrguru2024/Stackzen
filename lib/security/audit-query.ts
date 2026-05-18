import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export type AuditLogRow = {
  id: string;
  userId: string | null;
  action: string;
  severity: string;
  details: unknown;
  resource: string | null;
  ipAddress: string | null;
  createdAt: Date;
  user?: { email: string | null } | null;
};

export async function queryAuditLogs(params: {
  userId?: string;
  action?: string;
  actionPrefix?: string;
  severity?: string;
  startDate?: Date;
  endDate?: Date;
  skip?: number;
  take?: number;
}): Promise<{ rows: AuditLogRow[]; total: number }> {
  const where: Prisma.AuditLogWhereInput = {};

  if (params.userId) where.userId = params.userId;
  if (params.severity) where.severity = params.severity;
  if (params.action) where.action = params.action;
  if (params.actionPrefix) {
    where.action = { startsWith: params.actionPrefix };
  }
  if (params.startDate || params.endDate) {
    where.createdAt = {};
    if (params.startDate) where.createdAt.gte = params.startDate;
    if (params.endDate) where.createdAt.lte = params.endDate;
  }

  const [total, rows] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: params.skip,
      take: params.take ?? 50,
      include: { user: { select: { email: true } } },
    }),
  ]);

  return { rows, total };
}
