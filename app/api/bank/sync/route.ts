import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuthSession } from '@/lib/api/require-auth';
import { enforceApiRateLimit } from '@/lib/api/rate-limit-request';
import { prisma } from '@/lib/prisma';
import { createFinancialEventSafe } from '@/lib/financial-events/events';
import { FinancialEntityType, FinancialEventSource, FinancialEventType } from '@prisma/client';
import { runBankSyncForConnection } from '@/lib/bank/sync-runner';

const syncBodySchema = z.object({
  connectionId: z.string().min(1).optional(),
});

export async function POST(request: Request) {
  const limited = await enforceApiRateLimit(request, 'plaid_sync', { strict: true });
  if (limited) return limited;

  const { session, response } = await requireAuthSession();
  if (response) return response;

  let body: unknown = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  const parsed = syncBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { connectionId } = parsed.data;

  const connection = connectionId
    ? await prisma.bankConnection.findFirst({
        where: { id: connectionId, userId: session.user.id, status: 'ACTIVE' },
      })
    : await prisma.bankConnection.findFirst({
        where: { userId: session.user.id, status: 'ACTIVE' },
      });

  if (!connection) {
    return NextResponse.json(
      {
        error: connectionId
          ? 'No ACTIVE bank connection found for that id on your account'
          : 'No active bank connection found',
      },
      { status: 404 }
    );
  }

  try {
    const result = await runBankSyncForConnection(session.user.id, connection.id);
    return NextResponse.json(result);
  } catch (error) {
    await prisma.bankConnection.update({
      where: { id: connection.id },
      data: {
        lastSyncErrorAt: new Date(),
        syncErrorCode: error instanceof Error ? error.name : 'UNKNOWN',
      },
    });

    await createFinancialEventSafe({
      userId: session.user.id,
      type: FinancialEventType.BANK_SYNC_FAILED,
      source: FinancialEventSource.API_BANK,
      relatedEntityType: FinancialEntityType.BANK_CONNECTION,
      relatedEntityId: connection.id,
      metadata: {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    });

    return NextResponse.json({ error: 'Failed to sync bank transactions' }, { status: 500 });
  }
}
