import { NextResponse } from 'next/server';
import { requireAuthSession } from '@/lib/api/require-auth';
import { prisma } from '@/lib/prisma';
import { resolveIncomeProfileActivation } from '@/lib/income-profiles/activation';

export async function GET() {
  const { session, response } = await requireAuthSession();
  if (response) return response;

  const profiles = await prisma.userIncomeProfile.findMany({
    where: { userId: session.user.id, isActive: true },
    orderBy: { createdAt: 'asc' },
    select: { type: true },
  });

  const activation = resolveIncomeProfileActivation(profiles.map(profile => profile.type));
  return NextResponse.json(activation);
}

