import type { UserRole } from '@prisma/client';
import { isPrivilegedEmail } from '@/lib/auth/privileged-users';
import { isWebAuthnEnabled } from '@/lib/auth/webauthn';

/** Max JWT lifetime for admin roles (seconds). */
export const ADMIN_SESSION_MAX_AGE_SECONDS = 8 * 60 * 60;

/** Idle timeout — no admin API/page activity (ms). */
export const ADMIN_IDLE_TIMEOUT_MS = 30 * 60 * 1000;

export type AdminMfaUser = {
  twoFactorEnabled: boolean;
  mfaRequired: boolean;
  webAuthnEnabled: boolean;
  passkeyPreferred: boolean;
};

export function isAdminDbRole(role: string | null | undefined): boolean {
  return role === 'ADMIN' || role === 'SUPER_ADMIN';
}

export function resolveEffectiveAdminRole(
  role: string,
  email: string | null | undefined
): UserRole | 'SUPER_ADMIN' {
  if (isPrivilegedEmail(email)) return 'SUPER_ADMIN';
  return role as UserRole;
}

export function adminMustUseMfa(
  role: string,
  mfaRequired: boolean,
  email: string | null | undefined
): boolean {
  return mfaRequired || isAdminDbRole(role) || isPrivilegedEmail(email);
}

export function adminHasMfaEnabled(user: AdminMfaUser): boolean {
  return (
    user.twoFactorEnabled ||
    (isWebAuthnEnabled() && user.webAuthnEnabled && user.passkeyPreferred)
  );
}

export function isSessionIdle(lastActiveAt: Date, now = Date.now()): boolean {
  return now - lastActiveAt.getTime() > ADMIN_IDLE_TIMEOUT_MS;
}
