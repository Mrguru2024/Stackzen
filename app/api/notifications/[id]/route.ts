import { NextResponse } from 'next/server';
import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { requireAuthSession } from '@/lib/api/require-auth';
import { prisma } from '@/lib/prisma';

/**
 * Legacy DELETE used by older hooks → maps to dismissal on AutomationNotification.metadata.
 */
export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireAuthSession();
  if (response) return response;

  const { id } = await context.params;
  if (!z.string().cuid().safeParse(id).success) {
    return NextResponse.json({ error: 'Invalid notification id' }, { status: 400 });
  }

  const existing = await prisma.automationNotification.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const md =
    existing.metadata && typeof existing.metadata === 'object' && !Array.isArray(existing.metadata)
      ? ({ ...(existing.metadata as Record<string, unknown>) } as Record<string, unknown>)
      : ({} as Record<string, unknown>);

  md.dismissedAt = new Date().toISOString();

  const updated = await prisma.automationNotification.update({
    where: { id },
    data: { metadata: md as unknown as Prisma.InputJsonValue },
  });

  return NextResponse.json(updated);
}
