import type { Prisma } from '@prisma/client';
import { logAdminAudit } from '@/lib/api/require-admin';
import { AUDIT_ACTIONS } from '@/lib/security/audit-catalog';
import { getClientIp } from '@/lib/api/rate-limit-request';

export function maskEmail(email: string | null | undefined): string | null {
  if (!email) return null;
  const at = email.indexOf('@');
  if (at <= 0) return '[REDACTED]';
  const local = email.slice(0, at);
  const domain = email.slice(at + 1);
  const visible = local.length <= 1 ? '*' : `${local[0]}***`;
  return `${visible}@${domain}`;
}

export const adminUserPublicSelect = {
  id: true,
  name: true,
  role: true,
  subscriptionLevel: true,
  lastLogin: true,
  createdAt: true,
  _count: { select: { sessions: true } },
} satisfies Prisma.UserSelect;

export const adminUserSensitiveSelect = {
  ...adminUserPublicSelect,
  email: true,
} satisfies Prisma.UserSelect;

export function parseIncludeSensitive(searchParams: URLSearchParams): boolean {
  const raw = searchParams.get('includeSensitive');
  return raw === 'true' || raw === '1';
}

export async function auditAdminSensitiveView(params: {
  adminUserId: string;
  resource: string;
  request: Request;
  fields?: string[];
}): Promise<void> {
  await logAdminAudit({
    adminUserId: params.adminUserId,
    action: AUDIT_ACTIONS.ADMIN_VIEW_SENSITIVE,
    resource: params.resource,
    details: { fields: params.fields ?? ['pii'] },
    ipAddress: getClientIp(params.request),
  });
}

export function redactUserRow<T extends { email?: string | null }>(
  row: T,
  includeSensitive: boolean
): T {
  if (includeSensitive || row.email == null) return row;
  return { ...row, email: maskEmail(row.email) };
}
