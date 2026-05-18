import type { UserRole } from '@prisma/client';
import { IPBlocker } from '@/lib/auth/ip-blocker';
import { writeAuditLog } from '@/lib/security/audit-log';
import { isKnownDevice } from '@/lib/security/user-session';

export type LoginRiskInput = {
  userId?: string;
  email?: string;
  ip: string;
  userAgent?: string;
  success: boolean;
  role?: UserRole;
};

export type LoginRiskResult = {
  blocked: boolean;
  challengeMfa: boolean;
  reasons: string[];
};

/**
 * Non-aggressive login risk evaluation: log and challenge before hard blocks (except IP block list).
 */
export async function evaluateLoginRisk(input: LoginRiskInput): Promise<LoginRiskResult> {
  const reasons: string[] = [];
  const ipBlocker = IPBlocker.getInstance();

  if (await ipBlocker.isBlocked(input.ip)) {
    return { blocked: true, challengeMfa: false, reasons: ['ip_blocked'] };
  }

  if (!input.success) {
    await ipBlocker.recordFailedAttempt(input.ip);
    if (input.userId) {
      await writeAuditLog({
        userId: input.userId,
        action: 'auth.login_failed',
        severity: 'warning',
        details: { email: input.email },
        ipAddress: input.ip,
      });
    }
    return { blocked: false, challengeMfa: false, reasons: ['failed_attempt_recorded'] };
  }

  await ipBlocker.recordSuccessfulAttempt(input.ip);

  if (!input.userId) {
    return { blocked: false, challengeMfa: false, reasons };
  }

  const known = await isKnownDevice(input.userId, input.ip, input.userAgent);
  if (!known) {
    reasons.push('new_device');
    await writeAuditLog({
      userId: input.userId,
      action: 'auth.new_device',
      severity: 'warning',
      details: { userAgent: input.userAgent },
      ipAddress: input.ip,
    });
  }

  const isAdmin = input.role === 'ADMIN' || input.role === 'SUPER_ADMIN';
  if (isAdmin && !known) {
    reasons.push('admin_new_device');
    await writeAuditLog({
      userId: input.userId,
      action: 'auth.admin_login_new_device',
      severity: 'warning',
      ipAddress: input.ip,
    });
  }

  // Placeholder: impossible travel — log only when country changes (requires geo provider).
  const travelFlag = process.env.LOGIN_GEO_ENABLED === 'true';
  if (travelFlag) {
    reasons.push('geo_check_skipped');
  }

  const challengeMfa = reasons.includes('new_device');

  await writeAuditLog({
    userId: input.userId,
    action: 'auth.login_success',
    severity: 'info',
    details: { reasons },
    ipAddress: input.ip,
  });

  return { blocked: false, challengeMfa, reasons };
}
