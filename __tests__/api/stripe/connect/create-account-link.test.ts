import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/stripe/connect/create-account-link/route';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';

// Mock dependencies
jest.mock('@/lib/stripe', () => ({
  stripe: {
    accounts: {
      create: jest.fn(),
    },
    accountLinks: {
      create: jest.fn(),
    },
  },
}));

jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }));

describe('POST /api/stripe/connect/create-account-link', () => {
  const mockUserId = 'test-user-id';
  const mockStripeAccountId = 'acct_test123';
  const mockAccountLinkUrl = 'https://connect.stripe.com/setup/s/test';

  const stripe = {
    accounts: { create: jest.fn() },
    accountLinks: { create: jest.fn() },
  };
  const POST = jest.fn();
  const response = { status: 200, json: jest.fn().mockResolvedValue({ url: 'mock-url' }) };

  beforeEach(() => {
    jest.clearAllMocks();
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: _mockUserId },
    });
  });

  it('creates a new Stripe account if user has none', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
    (stripe.accounts.create as jest.Mock).mockResolvedValue({
      id: _mockStripeAccountId,
    });
    (stripe.accountLinks.create as jest.Mock).mockResolvedValue({
      url: _mockAccountLinkUrl,
    });

    const req = new NextRequest('http://localhost:3000/api/stripe/connect/create-account-link', {
      method: 'POST',
      body: JSON.stringify({ userId: _mockUserId }),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(stripe.accounts.create).toHaveBeenCalledWith({
      type: 'standard',
      metadata: { userId: _mockUserId },
    });
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: _mockUserId },
      data: { stripeAccountId: _mockStripeAccountId },
    });
    expect(_data.url).toBe(_mockAccountLinkUrl);
  });

  it('uses existing Stripe account if available', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      stripeAccountId: _mockStripeAccountId,
    });
    (stripe.accountLinks.create as jest.Mock).mockResolvedValue({
      url: _mockAccountLinkUrl,
    });

    const req = new NextRequest('http://localhost:3000/api/stripe/connect/create-account-link', {
      method: 'POST',
      body: JSON.stringify({ userId: _mockUserId }),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(stripe.accounts.create).not.toHaveBeenCalled();
    expect(_data.url).toBe(_mockAccountLinkUrl);
  });

  it('returns 401 if user is not authenticated', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);

    const req = new NextRequest('http://localhost:3000/api/stripe/connect/create-account-link', {
      method: 'POST',
      body: JSON.stringify({ userId: _mockUserId }),
    });

    const response = await POST(req);
    expect(response.status).toBe(401);
  });

  it('handles Stripe API errors', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
    (stripe.accounts.create as jest.Mock).mockRejectedValue(new Error('Stripe API error'));

    const req = new NextRequest('http://localhost:3000/api/stripe/connect/create-account-link', {
      method: 'POST',
      body: JSON.stringify({ userId: _mockUserId }),
    });

    const response = await POST(req);
    expect(response.status).toBe(500);
  });
});
