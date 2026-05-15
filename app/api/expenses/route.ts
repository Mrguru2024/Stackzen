import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cache, cacheKeys, CACHE_TTL } from '@/lib/redis';
import { CacheInvalidation } from '@/lib/cache-invalidation';
import { z } from 'zod';
import { requireAuthSession } from '@/lib/api/require-auth';
import { recomputeJobRevenue } from '@/lib/jobs/revenue';
import { createFinancialEventSafe } from '@/lib/financial-events/events';
import {
  FinancialEntityType,
  FinancialEventSource,
  FinancialEventType,
  FinancialTransactionDirection,
  FinancialTransactionSource,
  Prisma,
} from '@prisma/client';
import { mergeOperationalFromTransactionClassification } from '@/lib/financial-automation/classification';
import { buildTransactionDedupeHash } from '@/lib/financial-automation/transactions';
import { evaluateAutomationForTransaction } from '@/lib/financial-automation/rules-engine';

const expenseSchema = z
  .object({
    date: z.string().transform(str => new Date(str)),
    description: z.string().min(1, 'Description is required'),
    category: z.string().min(1, 'Category is required'),
    amount: z.number().positive('Amount must be positive'),
    tags: z.array(z.string()).optional(),
    notes: z.string().optional(),
    receiptUrl: z.string().optional(),
    isRecurring: z.boolean().optional(),
    frequency: z.string().optional(),
    nextDueDate: z
      .string()
      .transform(str => new Date(str))
      .optional(),
    jobId: z.string().cuid().optional(),
  })
  .strict();

export async function GET() {
  try {
    const { session, response } = await requireAuthSession();
    if (response) return response;

    const userId = session.user.id;
    const cacheKey = cacheKeys.expenses(userId, 'all');

    const cachedData = await cache.get(cacheKey);
    if (cachedData) {
      return NextResponse.json(cachedData);
    }

    const expenses = await prisma.expense.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
    });

    await cache.set(cacheKey, expenses, CACHE_TTL.SHORT);

    return NextResponse.json(expenses);
  } catch (error) {
    console.error('[EXPENSES_GET]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { session, response } = await requireAuthSession();
    if (response) return response;

    const body = await req.json();
    const validatedData = expenseSchema.parse(body);

    if (validatedData.jobId) {
      const job = await prisma.job.findFirst({
        where: { id: validatedData.jobId, userId: session.user.id },
        select: { id: true },
      });
      if (!job) {
        return new NextResponse('Invalid jobId for this user', { status: 400 });
      }
    }

    const expense = await prisma.expense.create({
      data: {
        ...validatedData,
        userId: session.user.id,
      },
    });

    await CacheInvalidation.invalidateExpenseCaches(session.user.id);
    if (expense.jobId) {
      await recomputeJobRevenue(expense.jobId, session.user.id);
    }

    await createFinancialEventSafe({
      userId: session.user.id,
      type: FinancialEventType.EXPENSE_CREATED,
      source: FinancialEventSource.API_EXPENSES,
      amount: expense.amount,
      relatedEntityType: FinancialEntityType.EXPENSE,
      relatedEntityId: expense.id,
      metadata: {
        expenseId: expense.id,
        category: expense.category,
        jobId: expense.jobId,
        date: expense.date.toISOString(),
      },
    });

    const txDedupe = buildTransactionDedupeHash({
      source: FinancialTransactionSource.MANUAL,
      externalId: expense.id,
      postedAt: expense.date,
      amount: expense.amount,
      description: expense.description,
    });
    const operationalMetadata = mergeOperationalFromTransactionClassification(null, {
      direction: FinancialTransactionDirection.OUTFLOW,
      description: expense.description,
      userCategoryNameHint: expense.category,
      plaidPersonalFinanceDetailed: null,
    });
    const transaction = await prisma.financialTransaction.upsert({
      where: {
        userId_dedupeHash: {
          userId: session.user.id,
          dedupeHash: txDedupe,
        },
      },
      update: {
        amount: expense.amount,
        direction: FinancialTransactionDirection.OUTFLOW,
        postedAt: expense.date,
        description: expense.description,
        categoryName: expense.category,
        expenseId: expense.id,
        metadata: operationalMetadata as Prisma.InputJsonValue,
      },
      create: {
        userId: session.user.id,
        source: FinancialTransactionSource.MANUAL,
        dedupeHash: txDedupe,
        postedAt: expense.date,
        amount: expense.amount,
        direction: FinancialTransactionDirection.OUTFLOW,
        description: expense.description,
        categoryName: expense.category,
        expenseId: expense.id,
        metadata: operationalMetadata as Prisma.InputJsonValue,
      },
    });

    await evaluateAutomationForTransaction({
      userId: session.user.id,
      transactionId: transaction.id,
      amount: transaction.amount,
      categoryName: transaction.categoryName,
      direction: transaction.direction,
      triggerRef: 'expense-create',
    });

    return NextResponse.json(expense);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.errors), { status: 400 });
    }
    console.error('[EXPENSES_POST]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { session, response } = await requireAuthSession();
    if (response) return response;

    const body = await req.json();
    const { id, ...rest } = body as { id?: string; [key: string]: unknown };
    if (!id || typeof id !== 'string') {
      return new NextResponse('Expense id is required', { status: 400 });
    }
    const validatedData = expenseSchema.partial().strict().parse(rest);

    if (validatedData.jobId) {
      const job = await prisma.job.findFirst({
        where: { id: validatedData.jobId, userId: session.user.id },
        select: { id: true },
      });
      if (!job) {
        return new NextResponse('Invalid jobId for this user', { status: 400 });
      }
    }

    const existing = await prisma.expense.findFirst({
      where: { id, userId: session.user.id },
    });
    if (!existing) {
      return new NextResponse('Not found', { status: 404 });
    }

    const expense = await prisma.expense.update({
      where: { id },
      data: validatedData,
    });

    await CacheInvalidation.invalidateExpenseCaches(session.user.id);
    if (expense.jobId) {
      await recomputeJobRevenue(expense.jobId, session.user.id);
    }

    await createFinancialEventSafe({
      userId: session.user.id,
      type: FinancialEventType.EXPENSE_UPDATED,
      source: FinancialEventSource.API_EXPENSES,
      amount: expense.amount,
      relatedEntityType: FinancialEntityType.EXPENSE,
      relatedEntityId: expense.id,
      metadata: {
        expenseId: expense.id,
        category: expense.category,
        jobId: expense.jobId,
        date: expense.date.toISOString(),
      },
    });

    const txDedupe = buildTransactionDedupeHash({
      source: FinancialTransactionSource.MANUAL,
      externalId: expense.id,
      postedAt: expense.date,
      amount: expense.amount,
      description: expense.description,
    });
    const operationalMetadata = mergeOperationalFromTransactionClassification(null, {
      direction: FinancialTransactionDirection.OUTFLOW,
      description: expense.description,
      userCategoryNameHint: expense.category,
      plaidPersonalFinanceDetailed: null,
    });
    const transaction = await prisma.financialTransaction.upsert({
      where: {
        userId_dedupeHash: {
          userId: session.user.id,
          dedupeHash: txDedupe,
        },
      },
      update: {
        amount: expense.amount,
        direction: FinancialTransactionDirection.OUTFLOW,
        postedAt: expense.date,
        description: expense.description,
        categoryName: expense.category,
        expenseId: expense.id,
        metadata: operationalMetadata as Prisma.InputJsonValue,
      },
      create: {
        userId: session.user.id,
        source: FinancialTransactionSource.MANUAL,
        dedupeHash: txDedupe,
        postedAt: expense.date,
        amount: expense.amount,
        direction: FinancialTransactionDirection.OUTFLOW,
        description: expense.description,
        categoryName: expense.category,
        expenseId: expense.id,
        metadata: operationalMetadata as Prisma.InputJsonValue,
      },
    });

    await evaluateAutomationForTransaction({
      userId: session.user.id,
      transactionId: transaction.id,
      amount: transaction.amount,
      categoryName: transaction.categoryName,
      direction: transaction.direction,
      triggerRef: 'expense-update',
    });

    return NextResponse.json(expense);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.errors), { status: 400 });
    }
    console.error('[EXPENSES_PATCH]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { session, response } = await requireAuthSession();
    if (response) return response;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return new NextResponse('Expense ID is required', { status: 400 });
    }

    const existing = await prisma.expense.findFirst({
      where: { id, userId: session.user.id },
    });
    if (!existing) {
      return new NextResponse('Not found', { status: 404 });
    }

    await prisma.expense.delete({
      where: { id },
    });

    await CacheInvalidation.invalidateExpenseCaches(session.user.id);
    if (existing.jobId) {
      await recomputeJobRevenue(existing.jobId, session.user.id);
    }

    await createFinancialEventSafe({
      userId: session.user.id,
      type: FinancialEventType.EXPENSE_DELETED,
      source: FinancialEventSource.API_EXPENSES,
      amount: existing.amount,
      relatedEntityType: FinancialEntityType.EXPENSE,
      relatedEntityId: existing.id,
      metadata: {
        expenseId: existing.id,
        category: existing.category,
        jobId: existing.jobId,
        date: existing.date.toISOString(),
      },
    });

    await prisma.financialTransaction.deleteMany({
      where: {
        userId: session.user.id,
        expenseId: existing.id,
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('[EXPENSES_DELETE]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}
