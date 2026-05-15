import type { Prisma } from '@prisma/client';
import { FinancialEntityType, FinancialEventSource, FinancialEventType } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export type FinancialEventInput = {
  userId: string;
  type: FinancialEventType;
  source: FinancialEventSource;
  amount?: number | null;
  currency?: string;
  relatedEntityType?: FinancialEntityType;
  relatedEntityId?: string;
  metadata?: Prisma.InputJsonValue;
};

export async function createFinancialEvent(input: FinancialEventInput) {
  return prisma.financialEvent.create({
    data: {
      userId: input.userId,
      type: input.type,
      source: input.source,
      amount: input.amount ?? null,
      currency: input.currency ?? 'USD',
      relatedEntityType: input.relatedEntityType,
      relatedEntityId: input.relatedEntityId,
      metadata: input.metadata,
    },
  });
}

export async function createFinancialEventSafe(input: FinancialEventInput): Promise<void> {
  try {
    await createFinancialEvent(input);
  } catch (error) {
    console.error('[financial-event] failed to write event', error);
  }
}

