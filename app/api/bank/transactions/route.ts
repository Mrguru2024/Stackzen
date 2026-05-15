import { NextResponse } from 'next/server';
import { requireAuthSession } from '@/lib/api/require-auth';
import { enforceApiRateLimit } from '@/lib/api/rate-limit-request';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const limited = await enforceApiRateLimit(request, 'plaid_transactions');
  if (limited) return limited;

  const { session, response } = await requireAuthSession();
  if (response) return response;

  const { searchParams } = new URL(request.url);
  const limitRaw = Number(searchParams.get('limit') ?? '100');
  const limit = Number.isNaN(limitRaw) ? 100 : Math.max(1, Math.min(500, limitRaw));

  const transactions = await prisma.financialTransaction.findMany({
    where: {
      userId: session.user.id,
      source: 'PLAID_SYNC',
    },
    orderBy: { postedAt: 'desc' },
    take: limit,
  });

  return NextResponse.json(transactions);
}
