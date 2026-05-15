import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { NotificationService } from '@/lib/services/notification-service';
import type { BudgetAllocation } from '@prisma/client';
import type { SpendingGuardrail } from '@/lib/types/financial-wellness';

const guardrailSchema = z.object({
  category: z.string(),
  limit: z.number().positive(),
  current: z.number().min(0),
  period: z.enum(['daily', 'weekly', 'monthly']),
  notifications: z.boolean(),
});

const PERIODS = new Set(['daily', 'weekly', 'monthly']);

function toGuardrail(a: BudgetAllocation): SpendingGuardrail {
  const period = (PERIODS.has(a.period) ? a.period : 'monthly') as SpendingGuardrail['period'];
  return {
    id: a.id,
    userId: a.userId,
    category: a.category,
    limit: a.amount,
    current: a.spent,
    period,
    notifications: a.notifications,
    createdAt: a.createdAt,
    updatedAt: a.updatedAt,
  };
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rows = await prisma.budgetAllocation.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(rows.map(toGuardrail));
  } catch (error) {
    console.error('Error fetching guardrails:', error);
    return NextResponse.json({ error: 'Failed to fetch guardrails' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = guardrailSchema.parse(body);

    const row = await prisma.budgetAllocation.create({
      data: {
        userId: session.user.id,
        category: validatedData.category,
        amount: validatedData.limit,
        spent: validatedData.current,
        period: validatedData.period,
        notifications: validatedData.notifications,
      },
    });

    const guardrail = toGuardrail(row);
    await NotificationService.checkSpendingGuardrails(guardrail);

    return NextResponse.json(guardrail);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 });
    }

    console.error('Error creating guardrail:', error);
    return NextResponse.json({ error: 'Failed to create guardrail' }, { status: 500 });
  }
}
