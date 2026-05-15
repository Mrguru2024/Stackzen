import { NextResponse } from 'next/server';
import { requireAuthSession } from '@/lib/api/require-auth';
import { prisma } from '@/lib/prisma';

/**
 * Auth-aligned bucket list for Money Control (automation envelopes + user buckets).
 */
export async function GET() {
  const { session, response } = await requireAuthSession();
  if (response) return response;

  const buckets = await prisma.smartBucket.findMany({
    where: { userId: session.user.id, isActive: true },
    include: {
      allocations: {
        orderBy: { createdAt: 'desc' },
        take: 30,
      },
    },
    orderBy: [{ type: 'asc' }, { name: 'asc' }],
  });

  return NextResponse.json({ buckets });
}
