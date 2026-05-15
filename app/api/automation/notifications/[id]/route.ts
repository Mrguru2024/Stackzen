import { NextResponse } from 'next/server';
import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { requireAuthSession } from '@/lib/api/require-auth';
import { prisma } from '@/lib/prisma';

const patchSchema = z
  .object({
    /** Mark automation notification read */
    markRead: z.boolean().optional(),
    /** Bump snooze in hours (stored in metadata) */
    snoozeHours: z.number().min(1).max(168).optional(),
    dismiss: z.boolean().optional(),
    /** User acknowledged acting on deterministic guidance (metadata.guidanceEngineVersion) */
    guidanceApplied: z.boolean().optional(),
  })
  .strict();

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireAuthSession();
  if (response) return response;

  const { id } = await context.params;
  if (!z.string().cuid().safeParse(id).success) {
    return NextResponse.json({ error: 'Invalid notification id' }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload', details: parsed.error.flatten() }, { status: 400 });
  }

  if (Object.keys(parsed.data).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
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

  if (parsed.data.snoozeHours != null) {
    const until = new Date(Date.now() + parsed.data.snoozeHours * 60 * 60 * 1000);
    md.snoozedUntil = until.toISOString();
    md.dismissedAt = null;
  }

  if (parsed.data.dismiss === true) {
    md.dismissedAt = new Date().toISOString();
  }

  if (parsed.data.guidanceApplied === true) {
    md.guidanceAppliedAt = new Date().toISOString();
  }

  const updated = await prisma.automationNotification.update({
    where: { id },
    data: {
      readAt:
        parsed.data.markRead === true ? new Date() : parsed.data.markRead === false ? null : existing.readAt,
      metadata: md as unknown as Prisma.InputJsonValue,
    },
  });

  return NextResponse.json(updated);
}
