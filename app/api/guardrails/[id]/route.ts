import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { NotificationService } from '@/lib/services/notification-service';
import type { BudgetAllocation } from '@prisma/client';
import type { SpendingGuardrail } from '@/lib/types/financial-wellness';

const updateGuardrailSchema = z.object({
  category: z.string().optional(),
  limit: z.number().positive().optional(),
  current: z.number().min(0).optional(),
  period: z.enum(['daily', 'weekly', 'monthly']).optional(),
  notifications: z.boolean().optional(),
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

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const row = await prisma.budgetAllocation.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!row) {
      return NextResponse.json({ error: 'Guardrail not found' }, { status: 404 });
    }

    return NextResponse.json(toGuardrail(row));
  } catch (error) {
    console.error('Error fetching guardrail:', error);
    return NextResponse.json({ error: 'Failed to fetch guardrail' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const validatedData = updateGuardrailSchema.parse(body);

    const data: {
      category?: string;
      amount?: number;
      spent?: number;
      period?: string;
      notifications?: boolean;
    } = {};
    if (validatedData.category !== undefined) data.category = validatedData.category;
    if (validatedData.limit !== undefined) data.amount = validatedData.limit;
    if (validatedData.current !== undefined) data.spent = validatedData.current;
    if (validatedData.period !== undefined) data.period = validatedData.period;
    if (validatedData.notifications !== undefined) data.notifications = validatedData.notifications;

    const row = await prisma.budgetAllocation.updateMany({
      where: { id, userId: session.user.id },
      data,
    });

    if (row.count === 0) {
      return NextResponse.json({ error: 'Guardrail not found' }, { status: 404 });
    }

    const updated = await prisma.budgetAllocation.findFirstOrThrow({
      where: { id, userId: session.user.id },
    });
    const guardrail = toGuardrail(updated);

    if (typeof validatedData.current === 'number') {
      await NotificationService.checkSpendingGuardrails(guardrail);
    }

    return NextResponse.json(guardrail);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 });
    }

    console.error('Error updating guardrail:', error);
    return NextResponse.json({ error: 'Failed to update guardrail' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const result = await prisma.budgetAllocation.deleteMany({
      where: { id, userId: session.user.id },
    });

    if (result.count === 0) {
      return NextResponse.json({ error: 'Guardrail not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting guardrail:', error);
    return NextResponse.json({ error: 'Failed to delete guardrail' }, { status: 500 });
  }
}
