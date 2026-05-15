import { NextResponse } from 'next/server';
import { requireAuthSession } from '@/lib/api/require-auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const { session, response } = await requireAuthSession();
  if (response) return response;

  const notifications = await prisma.automationNotification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return NextResponse.json(notifications);
}
