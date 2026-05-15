import { NextResponse } from 'next/server';
import { requireAuthSession } from '@/lib/api/require-auth';
import { prisma } from '@/lib/prisma';
import {
  mergeOperationalCheckpoint,
  operationalCheckpointPatchSchema,
} from '@/lib/operational-state/checkpoint-payload';

export async function GET() {
  const { session, response } = await requireAuthSession();
  if (response) return response;

  const row = await prisma.userOperationalCheckpoint.findUnique({
    where: { userId: session.user.id },
  });

  return NextResponse.json({ payload: row?.payload ?? { version: 1 } });
}

export async function PATCH(request: Request) {
  const { session, response } = await requireAuthSession();
  if (response) return response;

  const parsed = operationalCheckpointPatchSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload', details: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await prisma.userOperationalCheckpoint.findUnique({
    where: { userId: session.user.id },
  });

  const merged = mergeOperationalCheckpoint(existing?.payload ?? { version: 1 }, parsed.data);

  const row = await prisma.userOperationalCheckpoint.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      payload: merged,
    },
    update: {
      payload: merged,
    },
  });

  return NextResponse.json({ payload: row.payload });
}
