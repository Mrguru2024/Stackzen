import { render, screen, waitFor } from '@testing-library/react';
import AdminDashboard from './page.tsx';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import Redis from 'ioredis';

const prisma = { user: { count: jest.fn(), findMany: jest.fn() } };

// Mock the dependencies
jest.mock('next-auth', () => ({ getServerSession: jest.fn() }));
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    errorLog: {
      findMany: jest.fn(),
    },
    $queryRaw: jest.fn(),
  },
}));

jest.mock('ioredis');

describe('AdminDashboard', () => {
  beforeEach(() => {
    // Mock getServerSession
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: '1', role: 'ADMIN' },
    });

    // Mock Prisma responses
    (prisma.user.count as jest.Mock).mockResolvedValue(100);
    (prisma.user.findMany as jest.Mock).mockResolvedValue([
      { id: '1', email: 'user1@example.com', lastLoginAt: new Date() },
    ]);
    (prisma.errorLog.findMany as jest.Mock).mockResolvedValue([
      { id: '1', message: 'Test error', createdAt: new Date() },
    ]);
    (prisma.$queryRaw as jest.Mock).mockResolvedValue([{ 1: 1 }]);

    // Mock Redis
    (Redis as jest.Mock).mockImplementation(() => ({
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    }));
  });

  it('renders admin metrics', async () => {
    render(await AdminDashboard());

    expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Total Users')).toBeInTheDocument();
    expect(screen.getByText('Active Users')).toBeInTheDocument();
    expect(screen.getByText('System Health')).toBeInTheDocument();
  });

  it('handles session error', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);

    render(await AdminDashboard());

    expect(screen.getByText('Access Denied')).toBeInTheDocument();
  });

  it('handles system health check errors', async () => {
    (prisma.$queryRaw as jest.Mock).mockRejectedValue(new Error('Database error'));

    render(await AdminDashboard());

    await waitFor(() => {
      expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
    });
  });
});
