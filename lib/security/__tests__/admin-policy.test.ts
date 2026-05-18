import {
  ADMIN_IDLE_TIMEOUT_MS,
  adminHasMfaEnabled,
  adminMustUseMfa,
  isAdminDbRole,
  isSessionIdle,
} from '@/lib/security/admin-policy';

jest.mock('@/lib/auth/webauthn', () => ({
  isWebAuthnEnabled: () => false,
}));

describe('admin-policy', () => {
  it('detects admin roles', () => {
    expect(isAdminDbRole('ADMIN')).toBe(true);
    expect(isAdminDbRole('SUPER_ADMIN')).toBe(true);
    expect(isAdminDbRole('USER')).toBe(false);
  });

  it('requires MFA for admins even when mfaRequired flag is false', () => {
    expect(adminMustUseMfa('ADMIN', false, 'admin@example.com')).toBe(true);
    expect(adminMustUseMfa('USER', false, 'user@example.com')).toBe(false);
  });

  it('treats TOTP as MFA', () => {
    expect(
      adminHasMfaEnabled({
        twoFactorEnabled: true,
        mfaRequired: false,
        webAuthnEnabled: false,
        passkeyPreferred: false,
      })
    ).toBe(true);
  });

  it('detects idle sessions', () => {
    const stale = new Date(Date.now() - ADMIN_IDLE_TIMEOUT_MS - 1000);
    expect(isSessionIdle(stale)).toBe(true);
    expect(isSessionIdle(new Date())).toBe(false);
  });
});
