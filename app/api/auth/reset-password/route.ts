import { hash } from 'bcryptjs';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { hashPasswordResetRawToken } from '@/lib/auth/password-reset-token';
import { validatePassword } from '@/lib/auth/password';
import { enforceApiRateLimit } from '@/lib/api/rate-limit-request';

const resetBodySchema = z
  .object({
    token: z.string().min(32).max(128),
    password: z.string().min(8).max(128),
  })
  .strict();

export async function POST(req: Request) {
  const limited = await enforceApiRateLimit(req, 'auth_password_reset');
  if (limited) {
    return limited;
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = resetBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const { token, password } = parsed.data;
  const strength = validatePassword(password);
  if (!strength.isValid) {
    return NextResponse.json({ error: 'Password does not meet requirements.' }, { status: 400 });
  }

  const tokenHash = hashPasswordResetRawToken(token);
  const row = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    select: { id: true, userId: true, expiresAt: true },
  });

  const now = new Date();
  if (!row || row.expiresAt <= now) {
    return NextResponse.json(
      { error: 'Invalid or expired reset link. Please request a new password reset.' },
      { status: 400 }
    );
  }

  const hashedPassword = await hash(password, 12);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: row.userId },
      data: { password: hashedPassword },
    }),
    prisma.passwordResetToken.deleteMany({ where: { userId: row.userId } }),
  ]);

  return NextResponse.json({ message: 'Password updated. You can sign in with your email and password.' });
}
