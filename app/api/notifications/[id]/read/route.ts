import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuthSession } from '@/lib/api/require-auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireAuthSession();
  if (response) return response;

  const { id } = await context.params;
  if (!z.string().cuid().safeParse(id).success) {
    return NextResponse.json({ error: 'Invalid notification id' }, { status: 400 });
  }

  const exists = await prisma.automationNotification.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!exists) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const updated = await prisma.automationNotification.update({
    where: { id },
    data: { readAt: new Date() },
  });

  return NextResponse.json(updated);
}
