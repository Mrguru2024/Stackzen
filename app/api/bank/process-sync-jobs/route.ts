import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { runBankSyncForConnection } from '@/lib/bank/sync-runner';

const MAX_BATCH = 10;
const MAX_RETRIES = 5;
const BACKOFF_BASE_MINUTES = 2;
const BACKOFF_MAX_MINUTES = 60;

export async function POST(request: Request) {
  const cronSecret = process.env.CRON_SECRET?.trim();
  if (!cronSecret) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 503 });
  }

  const provided = request.headers.get('x-cron-secret')?.trim();
  if (provided !== cronSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const jobs = await prisma.bankSyncJob.findMany({
    where: {
      OR: [
        { status: 'PENDING' },
        { status: 'FAILED', attemptCount: { lt: MAX_RETRIES } },
      ],
      scheduledAt: { lte: new Date() },
    },
    orderBy: { createdAt: 'asc' },
    take: MAX_BATCH,
  });

  let succeeded = 0;
  let failed = 0;

  for (const job of jobs) {
    await prisma.bankSyncJob.update({
      where: { id: job.id },
      data: {
        status: 'PROCESSING',
        startedAt: new Date(),
        attemptCount: { increment: 1 },
      },
    });

    try {
      await runBankSyncForConnection(job.userId, job.bankConnectionId);
      await prisma.bankSyncJob.update({
        where: { id: job.id },
        data: {
          status: 'SUCCEEDED',
          completedAt: new Date(),
          errorCode: null,
          errorMessage: null,
        },
      });
      succeeded += 1;
    } catch (error) {
      const attempts = job.attemptCount + 1;
      const shouldRetry = attempts < MAX_RETRIES;
      const backoffMinutes = Math.min(
        BACKOFF_MAX_MINUTES,
        BACKOFF_BASE_MINUTES * 2 ** Math.max(0, attempts - 1)
      );
      const nextRunAt = new Date(Date.now() + backoffMinutes * 60_000);

      await prisma.bankSyncJob.update({
        where: { id: job.id },
        data: {
          status: shouldRetry ? 'PENDING' : 'FAILED',
          scheduledAt: shouldRetry ? nextRunAt : job.scheduledAt,
          completedAt: new Date(),
          errorCode: error instanceof Error ? error.name : 'UNKNOWN',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        },
      });
      failed += 1;
    }
  }

  return NextResponse.json({
    queuedProcessed: jobs.length,
    succeeded,
    failed,
  });
}
