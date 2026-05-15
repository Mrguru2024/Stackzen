import { NextResponse } from 'next/server';
import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { requireAuthSession } from '@/lib/api/require-auth';
import { prisma } from '@/lib/prisma';
import { inferCategoryKind } from '@/lib/financial-automation/transactions';
import { FinancialEntityType, FinancialEventSource, FinancialEventType } from '@prisma/client';
import { createFinancialEventSafe } from '@/lib/financial-events/events';
import { evaluateAutomationForTransaction } from '@/lib/financial-automation/rules-engine';
import {
  budgetCategorySlugSchema,
  classifyOperationalTransaction,
  mergeOperationalMetadata,
  operationalTransactionClassSchema,
  parseOperationalFromMetadata,
} from '@/lib/financial-automation/classification';

const patchSchema = z
  .object({
    categoryName: z.string().min(1).max(120).optional(),
    budgetCategorySlug: budgetCategorySlugSchema.optional(),
    operationalClass: operationalTransactionClassSchema.optional(),
    businessPersonal: z.enum(['BUSINESS', 'PERSONAL']).optional(),
    isRecurringCandidate: z.boolean().optional(),
  })
  .strict();

function asMetadataRecord(md: unknown): Record<string, unknown> {
  if (md && typeof md === 'object' && !Array.isArray(md)) {
    return { ...(md as Record<string, unknown>) };
  }
  return {};
}

function plaidDetailedFromTxnMetadata(md: Record<string, unknown>): string | null {
  const pfc = md.personal_finance_category as { detailed?: string } | undefined;
  return (pfc?.detailed ?? null) as string | null;
}

function snapshotTxnId(snapshot: unknown): string | undefined {
  if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)) return undefined;
  const id = (snapshot as Record<string, unknown>).transactionId;
  return typeof id === 'string' ? id : undefined;
}

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireAuthSession();
  if (response) return response;

  const { id } = await context.params;
  if (!z.string().cuid().safeParse(id).success) {
    return NextResponse.json({ error: 'Invalid transaction id' }, { status: 400 });
  }

  const transaction = await prisma.financialTransaction.findFirst({
    where: { id, userId: session.user.id },
    include: { category: true },
  });

  if (!transaction) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const [allocations, executionCandidates] = await Promise.all([
    prisma.smartAllocation.findMany({
      where: { userId: session.user.id, financialTransactionId: id },
      include: { bucket: { select: { id: true, name: true, type: true, currentAmount: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.automationExecution.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 120,
      include: {
        rule: {
          select: { id: true, name: true, type: true, triggerType: true, premiumRequired: true },
        },
      },
    }),
  ]);

  const executions = executionCandidates.filter(ex => snapshotTxnId(ex.inputSnapshot) === id).slice(0, 20);

  const baseMeta = asMetadataRecord(transaction.metadata);
  const operational =
    parseOperationalFromMetadata(transaction.metadata) ??
    classifyOperationalTransaction({
      direction: transaction.direction,
      description: transaction.description,
      isTransferHint: transaction.isTransfer,
      plaidPersonalFinanceDetailed: plaidDetailedFromTxnMetadata(baseMeta) ?? transaction.subcategory,
      userCategoryNameHint: transaction.categoryName ?? undefined,
    });

  const explanation = {
    operationalClass: operational.operationalClass,
    budgetCategorySlug: operational.budgetCategorySlug,
    businessPersonal: operational.businessPersonal,
    trustNotes: [
      'Automation replays whenever you correct category or classification so bucket lines stay aligned with rules.',
      ...executions.slice(0, 3).map(
        ex =>
          `${ex.completedAt?.toISOString() ?? ex.startedAt.toISOString()} — ${ex.rule.name} (${ex.status})`
      ),
    ],
  };

  return NextResponse.json({
    transaction,
    allocations,
    executions,
    explanation,
  });
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireAuthSession();
  if (response) return response;

  const { id } = await context.params;
  if (!z.string().cuid().safeParse(id).success) {
    return NextResponse.json({ error: 'Invalid transaction id' }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload', details: parsed.error.flatten() }, { status: 400 });
  }

  if (Object.keys(parsed.data).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
  }

  const existing = await prisma.financialTransaction.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const hasOperationalPatch =
    parsed.data.budgetCategorySlug !== undefined ||
    parsed.data.operationalClass !== undefined ||
    parsed.data.businessPersonal !== undefined;

  const hasCategoryPatch = parsed.data.categoryName !== undefined;

  const categoryKind = inferCategoryKind(existing.direction, existing.description);

  let categoryId = existing.categoryId;
  let categoryNameOut = existing.categoryName;

  if (hasCategoryPatch) {
    const cn = parsed.data.categoryName!;
    let categoryRow = await prisma.transactionCategory.findFirst({
      where: { userId: session.user.id, name: cn, kind: categoryKind },
    });
    if (!categoryRow) {
      categoryRow = await prisma.transactionCategory.create({
        data: {
          userId: session.user.id,
          name: cn,
          kind: categoryKind,
          isSystem: false,
        },
      });
    }
    categoryId = categoryRow.id;
    categoryNameOut = categoryRow.name;
  }

  const baseMeta = asMetadataRecord(existing.metadata);
  const baseOperational =
    parseOperationalFromMetadata(existing.metadata) ??
    classifyOperationalTransaction({
      direction: existing.direction,
      description: existing.description,
      isTransferHint: existing.isTransfer,
      plaidPersonalFinanceDetailed: plaidDetailedFromTxnMetadata(baseMeta) ?? existing.subcategory,
      userCategoryNameHint: categoryNameOut ?? existing.categoryName ?? undefined,
    });

  const envelope = {
    operationalClass: parsed.data.operationalClass ?? baseOperational.operationalClass,
    budgetCategorySlug: parsed.data.budgetCategorySlug ?? baseOperational.budgetCategorySlug,
    businessPersonal: parsed.data.businessPersonal ?? baseOperational.businessPersonal,
  };

  const mergedMeta = hasOperationalPatch
    ? mergeOperationalMetadata(baseMeta, envelope)
    : (existing.metadata as Record<string, unknown> | null);

  const shouldReplayAutomation = hasOperationalPatch || hasCategoryPatch;

  const updated = await prisma.financialTransaction.update({
    where: { id },
    data: {
      ...(hasCategoryPatch ? { categoryId, categoryName: categoryNameOut } : {}),
      ...(hasOperationalPatch ? { metadata: mergedMeta as Prisma.InputJsonValue } : {}),
      ...(hasOperationalPatch ? { isTransfer: envelope.operationalClass === 'TRANSFER' } : {}),
      ...(parsed.data.isRecurringCandidate !== undefined
        ? { isRecurringCandidate: parsed.data.isRecurringCandidate }
        : {}),
    },
  });

  if (shouldReplayAutomation) {
    await createFinancialEventSafe({
      userId: session.user.id,
      type: FinancialEventType.TRANSACTION_CATEGORIZED,
      source: FinancialEventSource.API_AUTOMATION,
      amount: updated.amount,
      relatedEntityType: FinancialEntityType.TRANSACTION,
      relatedEntityId: updated.id,
      metadata: {
        categoryId: updated.categoryId,
        categoryName: updated.categoryName,
        operationalClass: envelope.operationalClass,
        budgetCategorySlug: envelope.budgetCategorySlug,
      },
    });

    await evaluateAutomationForTransaction({
      userId: session.user.id,
      transactionId: updated.id,
      amount: updated.amount,
      categoryName: updated.categoryName,
      direction: updated.direction,
      operationalClass: envelope.operationalClass,
      triggerRef: 'manual-categorization',
      description: updated.description,
    });
  }

  return NextResponse.json(updated);
}
