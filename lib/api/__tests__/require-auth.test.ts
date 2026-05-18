import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { requireAuthSession } from '@/lib/api/require-auth';

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

jest.mock('@/lib/auth-config', () => ({
  authOptions: {},
}));

describe('requireAuthSession', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 JSON when session is missing', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);

    const result = await requireAuthSession();
    expect(result.session).toBeNull();
    expect(result.response).toBeInstanceOf(NextResponse);
    expect(result.response?.status).toBe(401);

    const body = await result.response?.json();
    expect(body).toEqual({ error: 'Unauthorized' });
  });

  it('returns 401 when session has no user id', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({ user: { email: 'a@test.com' } });

    const result = await requireAuthSession();
    expect(result.response?.status).toBe(401);
  });

  it('returns session when authenticated', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: 'user-1', email: 'user@test.com' },
    });

    const result = await requireAuthSession();
    expect(result.response).toBeNull();
    expect(result.session?.user.id).toBe('user-1');
  });
});
