import { NextResponse } from 'next/server';
import { requireAuthSession } from '@/lib/api/require-auth';
import { prisma } from '@/lib/prisma';
import { buildAdaptiveActivationResponse } from '@/lib/operational-activation/build-response';

export async function GET() {
  const { session, response } = await requireAuthSession();
  if (response) return response;

  const row = await prisma.userOperationalCheckpoint.findUnique({
    where: { userId: session.user.id },
    select: { payload: true },
  });

  const body = await buildAdaptiveActivationResponse(session.user.id, row?.payload ?? { version: 1 });
  return NextResponse.json(body);
}
