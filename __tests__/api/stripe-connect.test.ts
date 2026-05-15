import { POST, GET } from '@/app/api/stripe/connect/route';
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

jest.mock('@/lib/auth-config', () => ({
  authOptions: {},
}));

jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

const { prisma } = jest.requireMock('@/lib/prisma') as {
  prisma: {
    user: { findUnique: jest.Mock; update: jest.Mock };
  };
};

jest.mock('@/lib/stripe/connect', () => ({
  createConnectedAccount: jest.fn().mockResolvedValue({ id: 'acct_123' }),
  createAccountLink: jest.fn().mockResolvedValue({
    url: 'https://connect.stripe.com/setup/s/acct_123',
  }),
}));

describe('Stripe Connect API Route', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
    jest.clearAllMocks();
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: 'user_123', email: 'test@example.com' },
    });
    prisma.user.findUnique.mockResolvedValue({
      id: 'user_123',
      email: 'test@example.com',
      stripeAccountId: null,
    });
    prisma.user.update.mockResolvedValue({});
  });

  it('POST returns a Stripe onboarding URL for an authenticated user', async () => {
    const req = new NextRequest('http://localhost:3000/api/stripe/connect', {
      method: 'POST',
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty('url');
    expect(typeof data.url).toBe('string');
    expect(data.url).toMatch(/^https:\/\/connect\.stripe\.com\//);
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'user_123' },
        data: { stripeAccountId: 'acct_123' },
      })
    );
  });

  it('GET returns an account link when user already has a Stripe account', async () => {
    prisma.user.findUnique.mockResolvedValueOnce({
      id: 'user_123',
      email: 'test@example.com',
      stripeAccountId: 'acct_existing',
    });
    const req = new NextRequest('http://localhost:3000/api/stripe/connect', {
      method: 'GET',
    });
    const res = await GET(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.url).toMatch(/^https:\/\/connect\.stripe\.com\//);
  });

  it('POST returns 401 when unauthenticated', async () => {
    (getServerSession as jest.Mock).mockResolvedValueOnce(null);
    const req = new NextRequest('http://localhost:3000/api/stripe/connect', {
      method: 'POST',
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });
});
