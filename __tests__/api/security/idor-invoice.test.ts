import { getServerSession } from 'next-auth';
import { findOwnedFirst } from '@/lib/db/owned';
import { GET } from '@/app/api/invoices/[invoiceId]/route';

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

jest.mock('@/lib/auth-config', () => ({
  authOptions: {},
}));

jest.mock('@/lib/db/owned', () => ({
  findOwnedFirst: jest.fn(),
}));

jest.mock('@/lib/security/safe-log', () => ({
  logSafeError: jest.fn(),
}));

describe('invoice IDOR protection', () => {
  const ctx = { params: Promise.resolve({ invoiceId: 'invoice-owned-by-b' }) };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when unauthenticated', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);

    const response = await GET(new Request('http://localhost/api/invoices/x'), ctx);
    expect(response.status).toBe(401);
    expect(findOwnedFirst).not.toHaveBeenCalled();
  });

  it('returns 404 when user A requests user B invoice (no row leak)', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({ user: { id: 'user-a' } });
    (findOwnedFirst as jest.Mock).mockResolvedValue(null);

    const response = await GET(new Request('http://localhost/api/invoices/invoice-owned-by-b'), ctx);
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body).toEqual({ error: 'Invoice not found' });
    expect(findOwnedFirst).toHaveBeenCalledTimes(1);
    const [, invoiceId, userId] = (findOwnedFirst as jest.Mock).mock.calls[0];
    expect(invoiceId).toBe('invoice-owned-by-b');
    expect(userId).toBe('user-a');
  });

  it('returns invoice only when owned by session user', async () => {
    const invoice = { id: 'invoice-owned-by-b', userId: 'user-a', number: 'INV-1' };
    (getServerSession as jest.Mock).mockResolvedValue({ user: { id: 'user-a' } });
    (findOwnedFirst as jest.Mock).mockResolvedValue(invoice);

    const response = await GET(new Request('http://localhost/api/invoices/invoice-owned-by-b'), ctx);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual(invoice);
  });
});
