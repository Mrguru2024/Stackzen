import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAdminSession, logAdminAudit } from '@/lib/api/require-admin';
import { getClientIp } from '@/lib/api/rate-limit-request';
import { AUDIT_ACTIONS } from '@/lib/security/audit-catalog';

const replaySchema = z
  .object({
    jobId: z.string().cuid().optional(),
    connectionId: z.string().cuid().optional(),
    limit: z.number().int().min(1).max(100).optional(),
  })
  .strict();

export async function POST(request: Request) {
  const { user, response } = await requireAdminSession();
  if (response || !user) return response;

  if (user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = replaySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload', details: parsed.error.flatten() }, { status: 400 });
  }

  const { jobId, connectionId, limit = 25 } = parsed.data;
  if (!jobId && !connectionId) {
    return NextResponse.json(
      { error: 'Provide either jobId or connectionId' },
      { status: 400 }
    );
  }

  let updatedCount = 0;
  if (jobId) {
    const result = await prisma.bankSyncJob.updateMany({
      where: { id: jobId, status: 'FAILED' },
      data: {
        status: 'PENDING',
        scheduledAt: new Date(),
        errorCode: null,
        errorMessage: null,
        startedAt: null,
        completedAt: null,
      },
    });
    updatedCount = result.count;
  } else if (connectionId) {
    const result = await prisma.bankSyncJob.updateMany({
      where: { bankConnectionId: connectionId, status: 'FAILED' },
      data: {
        status: 'PENDING',
        scheduledAt: new Date(),
        errorCode: null,
        errorMessage: null,
        startedAt: null,
        completedAt: null,
      },
    });
    updatedCount = result.count;

    if (updatedCount === 0) {
      const connection = await prisma.bankConnection.findUnique({
        where: { id: connectionId },
        select: { id: true, userId: true },
      });
      if (connection) {
        await prisma.bankSyncJob.create({
          data: {
            userId: connection.userId,
            bankConnectionId: connection.id,
            status: 'PENDING',
            scheduledAt: new Date(),
          },
        });
        updatedCount = 1;
      }
    }
  }

  if (connectionId && updatedCount > limit) {
    await prisma.bankSyncJob.updateMany({
      where: { bankConnectionId: connectionId, status: 'PENDING' },
      data: { scheduledAt: new Date(Date.now() + 10 * 60_000) },
    });
  }

  await logAdminAudit({
    adminUserId: user.id,
    action: AUDIT_ACTIONS.ADMIN_BANK_SYNC_REPLAY,
    resource: jobId ?? connectionId ?? undefined,
    details: {
      jobId: jobId ?? null,
      connectionId: connectionId ?? null,
      replayedCount: updatedCount,
    },
    ipAddress: getClientIp(request),
  });

  return NextResponse.json({
    replayedCount: updatedCount,
    jobId: jobId ?? null,
    connectionId: connectionId ?? null,
  });
}
