import type { Prisma } from '@prisma/client';
import { AUDIT_ACTIONS, type AuditAction } from '@/lib/security/audit-catalog';
import { writeAuditLog } from '@/lib/security/audit-log';

export type FinancialAuditAction =
  | typeof AUDIT_ACTIONS.EXPENSE_CREATED
  | typeof AUDIT_ACTIONS.EXPENSE_UPDATED
  | typeof AUDIT_ACTIONS.EXPENSE_DELETED
  | typeof AUDIT_ACTIONS.INCOME_CREATED
  | typeof AUDIT_ACTIONS.INVOICE_CREATED
  | typeof AUDIT_ACTIONS.INVOICE_UPDATED
  | typeof AUDIT_ACTIONS.INVOICE_DELETED
  | typeof AUDIT_ACTIONS.INVOICE_SENT
  | typeof AUDIT_ACTIONS.QUOTE_CREATED
  | typeof AUDIT_ACTIONS.QUOTE_CONVERTED
  | typeof AUDIT_ACTIONS.BANK_CONNECTED
  | typeof AUDIT_ACTIONS.BANK_SYNCED;

export { AUDIT_ACTIONS };

export async function auditFinancialEvent(params: {
  userId: string;
  action: FinancialAuditAction | AuditAction;
  resource?: string;
  details?: Prisma.InputJsonValue;
  ipAddress?: string | null;
}): Promise<void> {
  await writeAuditLog({
    userId: params.userId,
    action: params.action,
    resource: params.resource,
    severity: 'info',
    details: params.details,
    ipAddress: params.ipAddress ?? undefined,
  });
}
