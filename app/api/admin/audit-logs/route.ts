import type { Prisma } from '@prisma/client';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminSession, logAdminAudit } from '@/lib/api/require-admin';
import { AUDIT_ACTIONS } from '@/lib/security/audit-catalog';
import { getClientIp } from '@/lib/api/rate-limit-request';
import {
  auditAdminSensitiveView,
  maskEmail,
  parseIncludeSensitive,
} from '@/lib/api/admin-pii';

export async function GET(request: Request) {
  const { user, response } = await requireAdminSession();
  if (response || !user) return response;

  try {
    const { searchParams } = new URL(request.url);
    const page = Number.parseInt(searchParams.get('page') || '1', 10);
    const pageSize = Number.parseInt(searchParams.get('pageSize') || '20', 10);
    const skip = (page - 1) * pageSize;
    const severity = searchParams.get('severity') || undefined;
    const action = searchParams.get('action') || undefined;
    const actionPrefix = searchParams.get('actionPrefix') || undefined;
    const userId = searchParams.get('userId') || undefined;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const exportType = searchParams.get('export');
    const includeSensitive = parseIncludeSensitive(searchParams);

    if (includeSensitive) {
      await auditAdminSensitiveView({
        adminUserId: user.id,
        resource: 'audit_logs.list',
        request,
        fields: ['user.email'],
      });
    }

    const where: Prisma.AuditLogWhereInput = {};
    if (severity) where.severity = severity;
    if (action) where.action = action;
    else if (actionPrefix) where.action = { startsWith: actionPrefix };
    if (userId) where.userId = userId;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    if (exportType === 'csv') {
      await logAdminAudit({
        adminUserId: user.id,
        action: AUDIT_ACTIONS.ADMIN_AUDIT_EXPORT,
        resource: 'audit_logs',
        ipAddress: getClientIp(request),
      });

      const logs = await prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { email: true } } },
      });
      const header = ['Time', 'User', 'Action', 'Severity', 'Details'];
      const rows = logs.map(log => [
        new Date(log.createdAt).toISOString(),
        (includeSensitive ? log.user?.email : maskEmail(log.user?.email)) || log.userId || '-',
        log.action,
        log.severity,
        typeof log.details === 'object' ? JSON.stringify(log.details) : String(log.details ?? ''),
      ]);
      const csv = [header, ...rows]
        .map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
        .join('\n');
      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="audit-logs.csv"',
        },
      });
    }

    const [total, logs] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
        include: { user: { select: { email: true } } },
      }),
    ]);

    const safeLogs = logs.map(log => ({
      ...log,
      user: log.user
        ? {
            email: includeSensitive ? log.user.email : maskEmail(log.user.email),
          }
        : null,
    }));

    return NextResponse.json({
      logs: safeLogs,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch {
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
