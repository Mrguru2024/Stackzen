import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { prisma } from '@/lib/prisma';
import { enforceApiRateLimit } from '@/lib/api/rate-limit-request';
import { issuePasswordResetToken } from '@/lib/auth/password-reset-token';
import { sendPrismaPasswordResetEmail } from '@/lib/auth/password-reset-email';

const GENERIC_MESSAGE =
  'If that email matches an account, you will receive reset instructions shortly. Check your inbox and spam folder.';

function normalizeOrigin(req: Request): string {
  const envBase =
    process.env.NEXTAUTH_URL?.trim() || process.env.NEXT_PUBLIC_APP_URL?.trim() || '';
  if (envBase) return envBase.replace(/\/+$/, '');
  return new URL(req.url).origin;
}

export async function POST(req: Request) {
  const limited = await enforceApiRateLimit(req, 'auth_password_reset_request', { strict: false });
  if (limited) {
    return limited;
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const email =
    typeof body === 'object' &&
    body !== null &&
    'email' in body &&
    typeof (body as { email: unknown }).email === 'string'
      ? (body as { email: string }).email.trim()
      : '';

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  const user = await prisma.user.findFirst({
    where: { email: { equals: email, mode: 'insensitive' } },
    select: { id: true, email: true, password: true },
  });

  if (user?.password) {
    try {
      const { rawToken } = await issuePasswordResetToken(user.id);
      const origin = normalizeOrigin(req);
      const resetUrl = `${origin}/reset-password?token=${encodeURIComponent(rawToken)}`;

      const to = user.email ?? email;
      const sent = await sendPrismaPasswordResetEmail({
        to,
        resetUrl,
      });

      if (!sent.ok) {
        await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });
        return NextResponse.json(
          {
            error: 'Password reset email could not be sent.',
            detail: sent.reason,
          },
          { status: 503 }
        );
      }

      return NextResponse.json({ message: GENERIC_MESSAGE });
    } catch (e) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[request-reset] prisma branch:', e);
      }
      return NextResponse.json(
        {
          error: 'Could not start password reset.',
        },
        { status: 500 }
      );
    }
  }

  if (supabaseUrl && anonKey) {
    const origin = normalizeOrigin(req);
    const redirectTo = `${origin}/reset-password`;
    const supabase = createClient(supabaseUrl, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    if (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[request-reset] Supabase:', error.message);
      }
      return NextResponse.json(
        {
          error: 'Could not send reset email right now. Try again shortly or contact support.',
        },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ message: GENERIC_MESSAGE });
}
