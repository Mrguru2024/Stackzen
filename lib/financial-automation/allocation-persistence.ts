import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export const AUTOMATION_ALLOCATION_SOURCE = 'AUTOMATION_RULE';

export function automationAllocationSourceForRule(ruleId: string) {
  return `${AUTOMATION_ALLOCATION_SOURCE}:${ruleId}`;
}

const AUTOMATION_BUCKET_TYPE = 'AUTOMATION_ENVELOPE';

/** Replace allocations for one automation rule + transaction and adjust SmartBucket totals. Idempotent for re-sync. */
export async function replaceAutomationAllocationsForTransaction(input: {
  userId: string;
  financialTransactionId: string;
  ruleId: string;
  ruleName: string;
  allocationSource: string;
  allocations: { bucket: string; allocatedAmount: number }[];
}) {
  const { userId, financialTransactionId, allocationSource } = input;

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const prior = await tx.smartAllocation.findMany({
      where: {
        userId,
        financialTransactionId,
        source: allocationSource,
      },
    });

    for (const row of prior) {
      await tx.smartBucket.update({
        where: { id: row.bucketId },
        data: {
          currentAmount: { decrement: row.amount },
        },
      });
    }

    await tx.smartAllocation.deleteMany({
      where: {
        userId,
        financialTransactionId,
        source: allocationSource,
      },
    });

    for (const line of input.allocations) {
      const slug = line.bucket.trim().toLowerCase();
      if (!slug || line.allocatedAmount <= 0) continue;
      const bucket = await ensureAutomationBucketViaTx(tx, userId, slug);
      await tx.smartAllocation.create({
        data: {
          userId,
          bucketId: bucket.id,
          amount: Number(line.allocatedAmount.toFixed(2)),
          source: allocationSource,
          description: `${input.ruleName} (${input.ruleId.slice(0, 8)})`,
          financialTransactionId,
        },
      });
      await tx.smartBucket.update({
        where: { id: bucket.id },
        data: {
          currentAmount: { increment: Number(line.allocatedAmount.toFixed(2)) },
        },
      });
    }
  });
}

/** Append a positive amount to an automation envelope (no ledger transaction), e.g. scheduled fixed saves. */
export async function appendAutomationEnvelopeContribution(input: {
  userId: string;
  ruleId: string;
  ruleName: string;
  allocationSource: string;
  bucketSlug: string;
  amount: number;
  description?: string;
  financialTransactionId?: string | null;
}) {
  const amt = Number(input.amount.toFixed(2));
  if (!Number.isFinite(amt) || amt <= 0) return;

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const slug = input.bucketSlug.trim().toLowerCase();
    if (!slug) return;
    const bucket = await ensureAutomationBucketViaTx(tx, input.userId, slug);
    await tx.smartAllocation.create({
      data: {
        userId: input.userId,
        bucketId: bucket.id,
        amount: amt,
        source: input.allocationSource,
        description:
          input.description?.trim() ||
          `${input.ruleName} (${input.ruleId.slice(0, 8)}) · scheduled save`,
        financialTransactionId: input.financialTransactionId ?? undefined,
      },
    });
    await tx.smartBucket.update({
      where: { id: bucket.id },
      data: { currentAmount: { increment: amt } },
    });
  });
}

async function ensureAutomationBucketViaTx(
  tx: Prisma.TransactionClient,
  userId: string,
  bucketSlug: string
) {
  const name = bucketSlug.trim().toLowerCase();
  const existing = await tx.smartBucket.findFirst({
    where: { userId, name, type: AUTOMATION_BUCKET_TYPE, isActive: true },
  });
  if (existing) return existing;
  return tx.smartBucket.create({
    data: {
      userId,
      name,
      type: AUTOMATION_BUCKET_TYPE,
      currentAmount: 0,
      isActive: true,
    },
  });
}
