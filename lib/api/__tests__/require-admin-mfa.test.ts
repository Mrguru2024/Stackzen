import { NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/api/require-admin';
import { requireAuthSession } from '@/lib/api/require-auth';
import { prisma } from '@/lib/prisma';
import { isPrivilegedEmail } from '@/lib/auth/privileged-users';

jest.mock('@/lib/api/require-auth');
jest.mock('@/lib/security/request-meta', () => ({
  getRequestClientMeta: jest.fn().mockResolvedValue({ ip: '127.0.0.1', userAgent: 'jest' }),
}));
jest.mock('@/lib/security/audit-log', () => ({
  writeAuditLog: jest.fn(),
}));
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findUnique: jest.fn() },
    userSession: {
      findFirst: jest.fn(),
      updateMany: jest.fn(),
    },
  },
}));
jest.mock('@/lib/auth/privileged-users');
jest.mock('@/lib/auth/webauthn', () => ({
  isWebAuthnEnabled: () => false,
}));

describe('requireAdminSession MFA gate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (isPrivilegedEmail as jest.Mock).mockReturnValue(false);
    (requireAuthSession as jest.Mock).mockResolvedValue({
      session: { user: { id: 'admin-1', email: 'admin@test.com' } },
      response: null,
    });
    (prisma.userSession.findFirst as jest.Mock).mockResolvedValue({
      id: 'sess-1',
      lastActiveAt: new Date(),
    });
    (prisma.userSession.updateMany as jest.Mock).mockResolvedValue({ count: 1 });
  });

  it('returns MFA_REQUIRED when admin has no MFA', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'admin-1',
      email: 'admin@test.com',
      role: 'ADMIN',
      twoFactorEnabled: false,
      mfaRequired: false,
      webAuthnEnabled: false,
      passkeyPreferred: false,
    });

    const result = await requireAdminSession();
    expect(result.response).toBeInstanceOf(NextResponse);
    expect(result.response?.status).toBe(403);
    const body = await result.response?.json();
    expect(body.code).toBe('MFA_REQUIRED');
  });

  it('allows admin when TOTP is enabled', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'admin-1',
      email: 'admin@test.com',
      role: 'ADMIN',
      twoFactorEnabled: true,
      mfaRequired: false,
      webAuthnEnabled: false,
      passkeyPreferred: false,
    });

    const result = await requireAdminSession();
    expect(result.response).toBeNull();
    expect(result.user?.id).toBe('admin-1');
  });

  it('returns ADMIN_SESSION_IDLE when session is stale', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'admin-1',
      email: 'admin@test.com',
      role: 'ADMIN',
      twoFactorEnabled: true,
      mfaRequired: false,
      webAuthnEnabled: false,
      passkeyPreferred: false,
    });
    (prisma.userSession.findFirst as jest.Mock).mockResolvedValue({
      id: 'sess-1',
      lastActiveAt: new Date(Date.now() - 31 * 60 * 1000),
    });

    const result = await requireAdminSession();
    expect(result.response?.status).toBe(401);
    const body = await result.response?.json();
    expect(body.code).toBe('ADMIN_SESSION_IDLE');
  });
});
