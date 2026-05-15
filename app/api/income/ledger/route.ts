import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { cache, cacheKeys } from '@/lib/redis';

const postSchema = z
  .object({
    amount: z.number().positive().max(1_000_000_000),
    date: z.string().min(1),
    source: z.string().min(1).max(200),
    notes: z.string().max(2000).optional().nullable(),
  })
  .strict();

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const rows = await prisma.income.findMany({
    where: { userId: session.user.id },
    orderBy: { date: 'desc' },
    take: 100,
    select: {
      id: true,
      amount: true,
      date: true,
      source: true,
      notes: true,
      createdAt: true,
    },
  });

  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const date = new Date(parsed.data.date);
  if (Number.isNaN(date.getTime())) {
    return NextResponse.json({ error: 'Invalid date' }, { status: 400 });
  }

  const row = await prisma.income.create({
    data: {
      userId: session.user.id,
      amount: parsed.data.amount,
      date,
      source: parsed.data.source,
      notes: parsed.data.notes ?? null,
    },
  });

  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  await cache.delete(cacheKeys.incomeSummary(session.user.id, monthKey));

  return NextResponse.json(row, { status: 201 });
}
