import { NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/api/require-admin';
import { GET as getAdminUsers } from '@/app/api/admin/users/route';

jest.mock('@/lib/api/require-admin', () => ({
  requireAdminSession: jest.fn(),
  logAdminAudit: jest.fn(),
}));

jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: { count: jest.fn(), findMany: jest.fn() },
  },
}));

jest.mock('@/lib/redis-edge', () => ({
  _RedisEdge: { get: jest.fn().mockResolvedValue('0') },
}));

describe('admin API authorization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('USER role receives 403 on GET /api/admin/users', async () => {
    (requireAdminSession as jest.Mock).mockResolvedValue({
      session: null,
      user: null,
      response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
    });

    const response = await getAdminUsers(new Request('http://localhost/api/admin/users'));
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body).toEqual({ error: 'Forbidden' });
  });

  it('returns MFA_REQUIRED payload when admin lacks MFA', async () => {
    (requireAdminSession as jest.Mock).mockResolvedValue({
      session: null,
      user: null,
      response: NextResponse.json(
        { error: 'MFA required', code: 'MFA_REQUIRED' },
        { status: 403 }
      ),
    });

    const response = await getAdminUsers(new Request('http://localhost/api/admin/users'));
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.code).toBe('MFA_REQUIRED');
  });
});
