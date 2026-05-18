/**
 * Canonical audit action names (dot-separated). All server writers should use these constants.
 */
export const AUDIT_ACTIONS = {
  // Auth
  AUTH_LOGIN_SUCCESS: 'auth.login_success',
  AUTH_LOGIN_FAILED: 'auth.login_failed',
  AUTH_LOGOUT: 'auth.logout',
  AUTH_PASSWORD_RESET_REQUESTED: 'auth.password_reset_requested',
  AUTH_PASSWORD_RESET_COMPLETED: 'auth.password_reset_completed',
  AUTH_2FA_ENABLED: 'auth.2fa_enabled',
  AUTH_2FA_DISABLED: 'auth.2fa_disabled',
  AUTH_NEW_DEVICE: 'auth.new_device',
  AUTH_ADMIN_LOGIN_NEW_DEVICE: 'auth.admin_login_new_device',

  // MFA / session
  MFA_REQUIRED_BLOCKED: 'mfa.required_blocked',
  SESSION_CREATED: 'session.created',
  SESSION_REVOKED: 'session.revoked',
  SESSION_ENDED: 'session.ended',
  ALL_SESSIONS_ENDED: 'session.all_ended',

  // Profile
  PROFILE_UPDATED: 'profile.updated',
  SECURITY_SETTINGS_CHANGED: 'security.settings_changed',

  // Financial
  EXPENSE_CREATED: 'expense.created',
  EXPENSE_UPDATED: 'expense.updated',
  EXPENSE_DELETED: 'expense.deleted',
  INCOME_CREATED: 'income.created',
  INVOICE_CREATED: 'invoice.created',
  INVOICE_UPDATED: 'invoice.updated',
  INVOICE_DELETED: 'invoice.deleted',
  INVOICE_SENT: 'invoice.sent',
  QUOTE_CREATED: 'quote.created',
  QUOTE_CONVERTED: 'quote.converted',

  // Bank / Plaid
  BANK_CONNECTED: 'bank.connected',
  BANK_SYNCED: 'bank.synced',
  PLAID_WEBHOOK_RECEIVED: 'plaid.webhook_received',

  // Stripe
  STRIPE_WEBHOOK_RECEIVED: 'stripe.webhook_received',
  STRIPE_WEBHOOK_PROCESSED: 'stripe.webhook_processed',
  STRIPE_WEBHOOK_DUPLICATE: 'stripe.webhook_duplicate',

  // AI
  AI_CONSENT_GRANTED: 'ai.consent_granted',
  AI_MEMORY_CLEARED: 'ai.memory_cleared',
  AI_CHAT_COMPLETED: 'ai.chat_completed',
  AI_PROMPT_BLOCKED: 'ai.prompt_blocked',
  AI_RESPONSE_POLICY_APPLIED: 'ai.response_policy_applied',
  AI_RECOMMENDATIONS_VIEWED: 'ai.recommendations_viewed',

  // Mentor
  MENTOR_SESSION_BOOKED: 'mentor.session_booked',
  MENTOR_ACCESS: 'mentor.access',

  // Admin
  ADMIN_DEVICE_REVOKE: 'admin.device.revoke',
  ADMIN_DEVICE_TRUST: 'admin.device.trust',
  ADMIN_USER_ACTION: 'admin.user.action',
  ADMIN_MENTOR_ACTION: 'admin.mentor.action',
  ADMIN_BANK_SYNC_REPLAY: 'admin.bank_sync.replay',
  ADMIN_VIEW_SENSITIVE: 'admin.view_sensitive',
  ADMIN_SESSION_IDLE: 'admin.session_idle',
  ADMIN_AUDIT_EXPORT: 'admin.audit.export',

  // Suspicious
  SUSPICIOUS_ACTIVITY: 'suspicious.activity',
  IP_BLOCKED: 'suspicious.ip_blocked',
  THREAT_DETECTED: 'suspicious.threat_detected',
} as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS];

const KNOWN_ACTIONS = new Set<string>(Object.values(AUDIT_ACTIONS));

export function isKnownAuditAction(action: string): boolean {
  return KNOWN_ACTIONS.has(action) || action.startsWith('admin.');
}
