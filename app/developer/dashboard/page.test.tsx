import { render, screen, waitFor } from '@testing-library/react';
import DeveloperDashboard from './page.tsx';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import Redis from 'ioredis';

// Mock next-auth
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

// Mock Redis
jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  }));
});

// Mock the dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    auditLog: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    user: {
      count: jest.fn(),
    },
  },
}));

const prisma = { auditLog: { count: jest.fn(), findMany: jest.fn() } };

describe('DeveloperDashboard', () => {
  beforeEach(() => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: '1', role: 'DEVELOPER' },
    });

    // Mock Prisma responses
    (prisma.auditLog.count as jest.Mock).mockResolvedValue(50);
    (prisma.auditLog.findMany as jest.Mock).mockResolvedValue([
      { id: '1', message: 'Test error', severity: 'error', createdAt: new Date() },
    ]);
    (prisma.user.count as jest.Mock).mockResolvedValue(25);

    // Mock fetch for system health
    global.fetch = jest.fn().mockResolvedValue({
      json: () =>
        Promise.resolve({
          database: 'healthy',
          redis: 'healthy',
          api: 'healthy',
        }),
    });
  });

  it('renders developer metrics', async () => {
    render(await DeveloperDashboard());

    expect(screen.getByText('Developer Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Total Errors')).toBeInTheDocument();
    expect(screen.getByText('Active Users')).toBeInTheDocument();
    expect(screen.getByText('System Health')).toBeInTheDocument();
  });

  it('handles session error', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);

    render(await DeveloperDashboard());

    expect(screen.getByText('Access Denied')).toBeInTheDocument();
  });

  it('handles API errors gracefully', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('API error'));

    render(await DeveloperDashboard());

    await waitFor(() => {
      expect(screen.getByText('Developer Dashboard')).toBeInTheDocument();
    });
  });

  it('displays recent errors', async () => {
    (prisma.auditLog.findMany as jest.Mock).mockResolvedValue([
      {
        id: '1',
        message: 'Test error',
        severity: 'error',
        createdAt: new Date(),
        details: { stack: 'Error stack' },
      },
    ]);

    render(await DeveloperDashboard());

    await waitFor(() => {
      expect(screen.getByText('Test error')).toBeInTheDocument();
    });
  });
});
