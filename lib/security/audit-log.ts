import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { isKnownAuditAction } from '@/lib/security/audit-catalog';
import { logSafeError } from '@/lib/security/safe-log';

export type AuditSeverity = 'info' | 'warning' | 'error' | 'critical';

/** Canonical audit event payload — single writer shape for Prisma `AuditLog`. */
export type AuditEvent = {
  userId?: string | null;
  action: string;
  resource?: string;
  severity?: AuditSeverity;
  details?: Prisma.InputJsonValue;
  ipAddress?: string | null;
};

export type WriteAuditLogParams = AuditEvent;

/**
 * Immutable append-only audit writer (Prisma `AuditLog` only).
 * Do not add UPDATE/DELETE paths for audit rows.
 */
export async function writeAuditLog(params: WriteAuditLogParams): Promise<void> {
  if (process.env.NODE_ENV === 'development' && !isKnownAuditAction(params.action)) {
    console.warn('[audit-log] unlisted action:', params.action);
  }

  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId ?? undefined,
        action: params.action,
        resource: params.resource,
        severity: params.severity ?? 'info',
        details:
          params.details === undefined
            ? undefined
            : (params.details as Prisma.InputJsonValue),
        ipAddress: params.ipAddress ?? undefined,
      },
    });
  } catch (error) {
    logSafeError('audit-log', error, { action: params.action });
    const { auditLogWriteFailedBreadcrumb } = await import('@/lib/security/sentry');
    auditLogWriteFailedBreadcrumb(params.action);
  }
}
