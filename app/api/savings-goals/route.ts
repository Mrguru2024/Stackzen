import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuthSession } from '@/lib/api/require-auth';

const createGoalSchema = z
  .object({
    name: z.string().min(1).max(200),
    description: z.string().max(2000).optional(),
    targetAmount: z.number().positive().finite(),
    currentAmount: z.number().nonnegative().finite().optional(),
    targetDate: z.string().datetime().optional(),
    category: z.string().max(100).optional(),
  })
  .strict();

export async function GET() {
  const { session, response } = await requireAuthSession();
  if (response) return response;

  try {
    const goals = await prisma.savingsGoal.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(goals);
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { session, response } = await requireAuthSession();
  if (response) return response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = createGoalSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const { name, description, targetAmount, currentAmount, targetDate, category } = parsed.data;

  try {
    const savingsGoal = await prisma.savingsGoal.create({
      data: {
        userId: session.user.id,
        name,
        description: description ?? null,
        targetAmount,
        currentAmount: currentAmount ?? 0,
        targetDate: targetDate ? new Date(targetDate) : null,
        category: category ?? 'general',
      },
    });
    return NextResponse.json(savingsGoal, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
