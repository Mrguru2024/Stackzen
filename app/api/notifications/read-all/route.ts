import { NextResponse } from 'next/server';
import { requireAuthSession } from '@/lib/api/require-auth';
import { prisma } from '@/lib/prisma';

/** Legacy path for clients calling `PATCH /api/notifications/read-all`. */
export async function PATCH() {
  const { session, response } = await requireAuthSession();
  if (response) return response;

  await prisma.automationNotification.updateMany({
    where: { userId: session.user.id, readAt: null },
    data: { readAt: new Date() },
  });

  return NextResponse.json({ success: true });
}
