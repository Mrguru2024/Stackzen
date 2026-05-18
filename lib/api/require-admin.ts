import { NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { requireAuthSession, type AuthedSession } from '@/lib/api/require-auth';
import {
  resolveAdminAccess,
  touchAdminSessionActivity,
  type AdminAccessDenyReason,
} from '@/lib/security/admin-access';
import { getRequestClientMeta } from '@/lib/security/request-meta';
import { writeAuditLog } from '@/lib/security/audit-log';
import { AUDIT_ACTIONS } from '@/lib/security/audit-catalog';

export type AdminUser = { id: string; email: string | null; role: string };

function denyResponse(reason: AdminAccessDenyReason): NextResponse {
  if (reason === 'unauthenticated') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (reason === 'mfa_required') {
    return NextResponse.json(
      { error: 'MFA required', code: 'MFA_REQUIRED' },
      { status: 403 }
    );
  }
  if (reason === 'session_idle') {
    return NextResponse.json(
      { error: 'Admin session expired due to inactivity', code: 'ADMIN_SESSION_IDLE' },
      { status: 401 }
    );
  }
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

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

  const meta = await getRequestClientMeta();
  const access = await resolveAdminAccess(session.user.id, {
    ip: meta.ip,
    userAgent: meta.userAgent,
    checkIdle: true,
  });

  if (!access.ok) {
    if (access.reason === 'session_idle') {
      await writeAuditLog({
        userId: session.user.id,
        action: AUDIT_ACTIONS.ADMIN_SESSION_IDLE,
        severity: 'warning',
        ipAddress: meta.ip,
      });
    }
    return {
      session: null,
      user: null,
      response: denyResponse(access.reason),
    };
  }

  await touchAdminSessionActivity(session.user.id, meta.ip, meta.userAgent);

  return {
    session,
    user: access.user,
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
  await writeAuditLog({
    userId: params.adminUserId,
    action: params.action.startsWith('admin.') ? params.action : `admin.${params.action}`,
    resource: params.resource,
    details: params.details,
    severity: 'info',
    ipAddress: params.ipAddress,
  });
}
