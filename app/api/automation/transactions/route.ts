import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuthSession } from '@/lib/api/require-auth';
import { prisma } from '@/lib/prisma';
import { mergeOperationalFromTransactionClassification } from '@/lib/financial-automation/classification';
import {
  buildTransactionDedupeHash,
  detectRecurringCandidate,
  inferCategoryKind,
  inferDirection,
  isTransferDescription,
} from '@/lib/financial-automation/transactions';
import { FinancialEventSource, FinancialEventType, FinancialEntityType, Prisma } from '@prisma/client';
import { createFinancialEventSafe } from '@/lib/financial-events/events';
import { evaluateAutomationForTransaction } from '@/lib/financial-automation/rules-engine';

const createTransactionSchema = z
  .object({
    amount: z.number().finite(),
    description: z.string().min(1).max(255),
    postedAt: z.string().datetime().optional(),
    categoryName: z.string().max(120).optional(),
    source: z.enum(['MANUAL', 'IMPORT']).default('MANUAL'),
  })
  .strict();

export async function GET() {
  const { session, response } = await requireAuthSession();
  if (response) return response;

  const rows = await prisma.financialTransaction.findMany({
    where: { userId: session.user.id },
    orderBy: { postedAt: 'desc' },
    take: 200,
  });
  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  const { session, response } = await requireAuthSession();
  if (response) return response;

  const parsed = createTransactionSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload', details: parsed.error.flatten() }, { status: 400 });
  }

  const postedAt = parsed.data.postedAt ? new Date(parsed.data.postedAt) : new Date();
  const direction = inferDirection(parsed.data.amount);
  const amount = Math.abs(parsed.data.amount);
  const kind = inferCategoryKind(direction, parsed.data.description);
  const categoryName = parsed.data.categoryName ?? kind;

  let category = await prisma.transactionCategory.findFirst({
    where: { userId: session.user.id, name: categoryName, kind },
  });
  if (!category) {
    category = await prisma.transactionCategory.create({
      data: {
        userId: session.user.id,
        name: categoryName,
        kind,
        isSystem: parsed.data.categoryName ? false : true,
      },
    });
  }

  const previous = await prisma.financialTransaction.findMany({
    where: { userId: session.user.id },
    select: { description: true },
    take: 20,
    orderBy: { postedAt: 'desc' },
  });
  const recurringCandidate = detectRecurringCandidate(
    parsed.data.description,
    previous.map(p => p.description)
  );
  const dedupeHash = buildTransactionDedupeHash({
    source: parsed.data.source,
    postedAt,
    amount,
    description: parsed.data.description,
  });

  const operationalMetadata = mergeOperationalFromTransactionClassification(null, {
    direction,
    description: parsed.data.description,
    isTransferHint: isTransferDescription(parsed.data.description),
    plaidPersonalFinanceDetailed: null,
    userCategoryNameHint: category.name,
  });

  const created = await prisma.financialTransaction.upsert({
    where: {
      userId_dedupeHash: {
        userId: session.user.id,
        dedupeHash,
      },
    },
    update: {
      categoryId: category.id,
      categoryName: category.name,
      direction,
      amount,
      postedAt,
      description: parsed.data.description,
      isTransfer: isTransferDescription(parsed.data.description),
      isRecurringCandidate: recurringCandidate,
      metadata: operationalMetadata as Prisma.InputJsonValue,
    },
    create: {
      userId: session.user.id,
      source: parsed.data.source,
      dedupeHash,
      postedAt,
      amount,
      direction,
      description: parsed.data.description,
      categoryId: category.id,
      categoryName: category.name,
      isTransfer: isTransferDescription(parsed.data.description),
      isRecurringCandidate: recurringCandidate,
      metadata: operationalMetadata as Prisma.InputJsonValue,
    },
  });

  await createFinancialEventSafe({
    userId: session.user.id,
    type: FinancialEventType.TRANSACTION_CREATED,
    source: FinancialEventSource.API_AUTOMATION,
    amount: created.amount,
    relatedEntityType: FinancialEntityType.TRANSACTION,
    relatedEntityId: created.id,
    metadata: {
      source: created.source,
      direction: created.direction,
      recurringCandidate: created.isRecurringCandidate,
    },
  });

  await evaluateAutomationForTransaction({
    userId: session.user.id,
    transactionId: created.id,
    amount: created.amount,
    categoryName: created.categoryName,
    direction: created.direction,
    triggerRef: 'manual-transaction',
  });

  return NextResponse.json(created, { status: 201 });
}
