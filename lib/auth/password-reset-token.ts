import crypto from 'crypto';
import { prisma } from '@/lib/prisma';

export const PASSWORD_RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

export function hashPasswordResetRawToken(raw: string): string {
  return crypto.createHash('sha256').update(raw, 'utf8').digest('hex');
}

export function createPasswordResetRawToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/** Replaces existing tokens for the user and stores a hashed token. Caller emails `rawToken` once. */
export async function issuePasswordResetToken(userId: string): Promise<{ rawToken: string }> {
  const rawToken = createPasswordResetRawToken();
  const tokenHash = hashPasswordResetRawToken(rawToken);

  await prisma.$transaction([
    prisma.passwordResetToken.deleteMany({ where: { userId } }),
    prisma.passwordResetToken.create({
      data: {
        tokenHash,
        userId,
        expiresAt: new Date(Date.now() + PASSWORD_RESET_TOKEN_TTL_MS),
      },
    }),
  ]);

  return { rawToken };
}
