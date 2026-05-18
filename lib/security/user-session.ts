import { prisma } from '@/lib/prisma';
import { deriveDeviceLabel, hashIp, hashUserAgent } from '@/lib/security/hash';
import { writeAuditLog } from '@/lib/security/audit-log';

const MAX_ACTIVE_SESSIONS = 5;

export type RecordUserSessionInput = {
  userId: string;
  ip?: string;
  userAgent?: string;
  deviceId?: string | null;
};

export async function recordUserSession(input: RecordUserSessionInput): Promise<string> {
  const ipHash = hashIp(input.ip ?? 'unknown');
  const userAgentHash = hashUserAgent(input.userAgent ?? 'unknown');
  const deviceLabel = input.deviceId?.trim() || deriveDeviceLabel(input.userAgent ?? '');

  const existing = await prisma.userSession.findFirst({
    where: {
      userId: input.userId,
      ipHash,
      userAgentHash,
      revokedAt: null,
    },
    select: { id: true },
  });

  if (existing) {
    await prisma.userSession.update({
      where: { id: existing.id },
      data: { lastActiveAt: new Date(), deviceLabel },
    });
    return existing.id;
  }

  const session = await prisma.userSession.create({
    data: {
      userId: input.userId,
      ipHash,
      userAgentHash,
      deviceLabel,
      lastActiveAt: new Date(),
    },
  });

  await enforceSessionLimit(input.userId);

  await writeAuditLog({
    userId: input.userId,
    action: 'session.created',
    resource: session.id,
    severity: 'info',
    details: { deviceLabel },
    ipAddress: input.ip ?? undefined,
  });

  return session.id;
}

async function enforceSessionLimit(userId: string): Promise<void> {
  const active = await prisma.userSession.findMany({
    where: { userId, revokedAt: null },
    orderBy: { lastActiveAt: 'asc' },
    select: { id: true },
  });

  if (active.length <= MAX_ACTIVE_SESSIONS) return;

  const toRevoke = active.slice(0, active.length - MAX_ACTIVE_SESSIONS);
  await prisma.userSession.updateMany({
    where: { id: { in: toRevoke.map(s => s.id) } },
    data: { revokedAt: new Date(), revokedReason: 'session_limit' },
  });
}

export async function revokeUserSession(
  sessionId: string,
  reason: string
): Promise<boolean> {
  const updated = await prisma.userSession.updateMany({
    where: { id: sessionId, revokedAt: null },
    data: { revokedAt: new Date(), revokedReason: reason },
  });
  return updated.count > 0;
}

export async function listActiveUserSessions(userId: string) {
  return prisma.userSession.findMany({
    where: { userId, revokedAt: null },
    orderBy: { lastActiveAt: 'desc' },
    include: {
      user: { select: { email: true } },
    },
  });
}

export async function isKnownDevice(userId: string, ip?: string, userAgent?: string): Promise<boolean> {
  const count = await prisma.userSession.count({
    where: {
      userId,
      ipHash: hashIp(ip ?? 'unknown'),
      userAgentHash: hashUserAgent(userAgent ?? 'unknown'),
      revokedAt: null,
    },
  });
  return count > 0;
}
