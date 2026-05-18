import { prisma } from '@/lib/prisma';
import { isPrivilegedEmail } from '@/lib/auth/privileged-users';
import { hashIp, hashUserAgent } from '@/lib/security/hash';
import {
  adminHasMfaEnabled,
  adminMustUseMfa,
  isAdminDbRole,
  isSessionIdle,
  resolveEffectiveAdminRole,
} from '@/lib/security/admin-policy';
import { getRequestClientMeta } from '@/lib/security/request-meta';

export type AdminAccessDenyReason =
  | 'unauthenticated'
  | 'forbidden'
  | 'mfa_required'
  | 'session_idle';

export type AdminAccessResult =
  | {
      ok: true;
      user: { id: string; email: string | null; role: string };
    }
  | { ok: false; reason: AdminAccessDenyReason };

const adminUserSelect = {
  id: true,
  email: true,
  role: true,
  twoFactorEnabled: true,
  mfaRequired: true,
  webAuthnEnabled: true,
  passkeyPreferred: true,
} as const;

async function findActiveAdminSession(userId: string, ip?: string, userAgent?: string) {
  return prisma.userSession.findFirst({
    where: {
      userId,
      ipHash: hashIp(ip ?? 'unknown'),
      userAgentHash: hashUserAgent(userAgent ?? 'unknown'),
      revokedAt: null,
    },
    select: { id: true, lastActiveAt: true },
    orderBy: { lastActiveAt: 'desc' },
  });
}

export async function touchAdminSessionActivity(
  userId: string,
  ip?: string,
  userAgent?: string
): Promise<void> {
  const ipHash = hashIp(ip ?? 'unknown');
  const userAgentHash = hashUserAgent(userAgent ?? 'unknown');
  await prisma.userSession.updateMany({
    where: { userId, ipHash, userAgentHash, revokedAt: null },
    data: { lastActiveAt: new Date() },
  });
}

export async function resolveAdminAccess(
  userId: string,
  options?: { ip?: string; userAgent?: string; checkIdle?: boolean }
): Promise<AdminAccessResult> {
  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    select: adminUserSelect,
  });

  if (!dbUser) {
    return { ok: false, reason: 'forbidden' };
  }

  const isPrivileged = isPrivilegedEmail(dbUser.email);
  const hasAdminRole = isAdminDbRole(dbUser.role);
  if (!hasAdminRole && !isPrivileged) {
    return { ok: false, reason: 'forbidden' };
  }

  if (adminMustUseMfa(dbUser.role, dbUser.mfaRequired, dbUser.email) && !adminHasMfaEnabled(dbUser)) {
    return { ok: false, reason: 'mfa_required' };
  }

  if (options?.checkIdle !== false) {
    const meta = options?.ip
      ? { ip: options.ip, userAgent: options.userAgent }
      : await getRequestClientMeta();
    const activeSession = await findActiveAdminSession(
      userId,
      meta.ip,
      meta.userAgent
    );
    if (activeSession && isSessionIdle(activeSession.lastActiveAt)) {
      return { ok: false, reason: 'session_idle' };
    }
  }

  const role = resolveEffectiveAdminRole(dbUser.role, dbUser.email);
  return {
    ok: true,
    user: { id: dbUser.id, email: dbUser.email, role },
  };
}

export async function assertAdminPageAccess(userId: string): Promise<AdminAccessResult> {
  return resolveAdminAccess(userId, { checkIdle: true });
}
