import { AUDIT_ACTIONS, isKnownAuditAction } from '@/lib/security/audit-catalog';

describe('audit-catalog', () => {
  it('includes core auth and financial actions', () => {
    expect(AUDIT_ACTIONS.AUTH_LOGIN_SUCCESS).toBe('auth.login_success');
    expect(AUDIT_ACTIONS.EXPENSE_CREATED).toBe('expense.created');
    expect(AUDIT_ACTIONS.STRIPE_WEBHOOK_PROCESSED).toBe('stripe.webhook_processed');
  });

  it('recognizes catalog and admin-prefixed actions', () => {
    expect(isKnownAuditAction(AUDIT_ACTIONS.INVOICE_SENT)).toBe(true);
    expect(isKnownAuditAction('admin.custom.action')).toBe(true);
    expect(isKnownAuditAction('unknown.thing')).toBe(false);
  });
});
