import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminSession } from '@/lib/api/require-admin';
import {
  auditAdminSensitiveView,
  maskEmail,
  parseIncludeSensitive,
} from '@/lib/api/admin-pii';

export async function GET(request: Request) {
  const { user, response } = await requireAdminSession();
  if (response || !user) return response;

  try {
    const includeSensitive = parseIncludeSensitive(new URL(request.url).searchParams);
    if (includeSensitive) {
      await auditAdminSensitiveView({
        adminUserId: user.id,
        resource: 'error_logs.list',
        request,
        fields: ['email', 'stack'],
      });
    }
    const fifteenDaysAgo = new Date();
    fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);
    const logs = await prisma.errorLog.findMany({
      where: {
        createdAt: { gte: fifteenDaysAgo },
      },
      include: {
        user: { select: { email: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return NextResponse.json({
      logs: logs.map(log => ({
        id: log.id,
        userId: log.userId,
        userEmail: includeSensitive ? log.user?.email : maskEmail(log.user?.email),
        message: log.message,
        stack: includeSensitive ? log.stack : null,
        createdAt: log.createdAt,
      })),
    });
  } catch {
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
