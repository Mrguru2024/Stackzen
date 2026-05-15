import { NextResponse } from 'next/server';
import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { requireAuthSession } from '@/lib/api/require-auth';
import { prisma } from '@/lib/prisma';

const querySchema = z.object({
  ruleId: z.string().cuid().optional(),
  transactionId: z.string().cuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(40),
});

function snapshotTxnId(snapshot: unknown): string | undefined {
  if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)) return undefined;
  const id = (snapshot as Record<string, unknown>).transactionId;
  return typeof id === 'string' ? id : undefined;
}

export async function GET(request: Request) {
  const { session, response } = await requireAuthSession();
  if (response) return response;

  const url = new URL(request.url);
  const parsed = querySchema.safeParse({
    ruleId: url.searchParams.get('ruleId') ?? undefined,
    transactionId: url.searchParams.get('transactionId') ?? undefined,
    limit: url.searchParams.get('limit') ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid query parameters' }, { status: 400 });
  }

  const { ruleId, transactionId, limit } = parsed.data;

  const whereClause: Prisma.AutomationExecutionWhereInput = {
    userId: session.user.id,
    ...(ruleId ? { ruleId } : {}),
  };

  const rows = await prisma.automationExecution.findMany({
    where: whereClause,
    orderBy: { createdAt: 'desc' },
    take: Math.min(limit * 3, 200),
    include: {
      rule: {
        select: { id: true, name: true, type: true, premiumRequired: true, triggerType: true },
      },
    },
  });

  let filtered =
    transactionId != null ? rows.filter(r => snapshotTxnId(r.inputSnapshot) === transactionId) : rows;

  filtered = filtered.slice(0, limit);

  return NextResponse.json({ executions: filtered });
}
