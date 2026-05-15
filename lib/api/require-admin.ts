import { NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireAuthSession, type AuthedSession } from '@/lib/api/require-auth';
import { isPrivilegedEmail } from '@/lib/auth/privileged-users';

export type AdminUser = { id: string; email: string | null; role: string };

export async function requireAdminSession(): Promise<
  | { session: AuthedSession; user: AdminUser; response: null }
  | { session: null; user: null; response: NextResponse }
> {
  const { session, response } = await requireAuthSession();
  if (response || !session) {
    return {
      session: null,
      user: null,
      response: response ?? NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, role: true },
  });

  const isPrivileged = isPrivilegedEmail(dbUser?.email ?? session.user.email);
  const hasAdminRole = dbUser?.role === 'ADMIN' || dbUser?.role === 'SUPER_ADMIN';
  if (!dbUser || (!hasAdminRole && !isPrivileged)) {
    return {
      session: null,
      user: null,
      response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
    };
  }

  return {
    session,
    user: {
      id: dbUser.id,
      email: dbUser.email,
      role: isPrivileged ? 'SUPER_ADMIN' : dbUser.role,
    },
    response: null,
  };
}

export async function logAdminAudit(params: {
  adminUserId: string;
  action: string;
  resource?: string;
  details?: Prisma.InputJsonValue;
  ipAddress?: string | null;
}): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.adminUserId,
        action: params.action,
        resource: params.resource,
        details: params.details ?? undefined,
        severity: 'info',
        ipAddress: params.ipAddress ?? undefined,
      },
    });
  } catch {
    console.error('[admin-audit] failed to write audit log');
  }
}
