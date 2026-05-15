import { createClient } from '@supabase/supabase-js';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

/**
 * After Prisma user signup, create or resolve a Supabase Auth user and return its UUID
 * so `User.authUserId` can be set for RLS. Requires service role; returns null if misconfigured.
 */
export async function resolveOrCreateSupabaseAuthUserId(params: {
  email: string;
  password: string;
}): Promise<string | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return null;
  }

  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email: params.email,
    password: params.password,
    email_confirm: true,
  });

  if (created.user?.id) {
    return created.user.id;
  }

  const msg = createErr?.message?.toLowerCase() ?? '';
  const duplicate =
    createErr?.status === 422 ||
    msg.includes('already been registered') ||
    msg.includes('already registered') ||
    msg.includes('duplicate');

  if (!duplicate) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[sync-prisma-auth-user-id] createUser failed:', createErr?.message);
    }
    return null;
  }

  try {
    const rows = await prisma.$queryRaw<{ id: string }[]>(
      Prisma.sql`SELECT id::text AS id FROM auth.users WHERE lower(email) = lower(${params.email}) LIMIT 1`,
    );
    return rows[0]?.id ?? null;
  } catch (e) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[sync-prisma-auth-user-id] auth.users lookup failed:', e);
    }
    return null;
  }
}
