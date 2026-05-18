import type { Prisma } from '@prisma/client';

/** Safe fields for API responses — never expose `accessTokenEncrypted`. */
export const bankConnectionPublicSelect = {
  id: true,
  userId: true,
  provider: true,
  status: true,
  itemId: true,
  institutionId: true,
  institutionName: true,
  accessTokenLast4: true,
  syncCursor: true,
  lastSuccessfulSyncAt: true,
  lastSyncErrorAt: true,
  syncErrorCode: true,
  disconnectedAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.BankConnectionSelect;

export type PublicBankConnection = Prisma.BankConnectionGetPayload<{
  select: typeof bankConnectionPublicSelect;
}>;

export function toPublicBankConnection(row: PublicBankConnection): PublicBankConnection {
  return row;
}
