import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuthSession } from '@/lib/api/require-auth';

/** Lists the signed-in user’s card transactions (Prisma: CardTransaction). */
export async function GET() {
  const { session, response } = await requireAuthSession();
  if (response) return response;

  try {
    const transactions = await prisma.cardTransaction.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return NextResponse.json(transactions);
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * CardTransaction creation is disabled — use domain-specific expense/card flows with validation.
 */
export async function POST() {
  return NextResponse.json(
    { error: 'Not implemented — use domain-specific expense/card APIs' },
    { status: 501 }
  );
}
