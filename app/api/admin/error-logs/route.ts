import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminSession } from '@/lib/api/require-admin';

export async function GET() {
  const { response } = await requireAdminSession();
  if (response) return response;

  try {
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
        userEmail: log.user?.email,
        message: log.message,
        stack: log.stack,
        createdAt: log.createdAt,
      })),
    });
  } catch {
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
