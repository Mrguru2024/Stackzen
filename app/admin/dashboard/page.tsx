import React from 'react';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { prisma } from '@/lib/prisma';
import Redis from 'ioredis';
import { RoleGuard } from '@/components/auth/RoleGuard';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

export default async function AdminDashboardPage() {
  const session = await getServerSession();
  if (!session?.user) {
    redirect('/auth/signin');
  }

  // Fetch various metrics
  const [
    totalUsers,
    activeUsers,
    blockedIPs,
    suspiciousIPs,
    recentLogins,
    recentErrors,
    systemHealth,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({
      where: { lastLogin: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
    }),
    redis.llen('ip:blocked:list'),
    redis.llen('ip:suspicious:list'),
    prisma.user.findMany({
      select: { id: true, email: true, lastLogin: true },
      orderBy: { lastLogin: 'desc' },
      take: 5,
    }),
    prisma.errorLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    getSystemHealth(),
  ]);

  return (
    <RoleGuard allowedRoles={['admin']}>
      <div className="container mx-auto px-4 py-8">
        <h1 className="mb-8 text-3xl font-bold">Admin Dashboard</h1>
        <AdminDashboard
          metrics={{
            totalUsers,
            activeUsers,
            blockedIPs,
            suspiciousIPs,
            recentLogins,
            recentErrors,
            systemHealth,
          }}
        />
      </div>
    </RoleGuard>
  );
}

async function getSystemHealth() {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    const dbStatus = 'healthy';

    // Check Redis connection
    await redis.ping();
    const redisStatus = 'healthy';

    // Check API endpoints
    const apiStatus = await checkAPIEndpoints();

    return {
      database: dbStatus,
      redis: redisStatus,
      api: apiStatus,
      lastChecked: new Date().toISOString(),
    };
  } catch (error) {
    console.error('System health check failed:', error);
    return {
      database: 'unhealthy',
      redis: 'unhealthy',
      api: [] as { endpoint: string; status: string }[],
      lastChecked: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function checkAPIEndpoints() {
  const endpoints = ['/api/auth/session', '/api/health', '/api/metrics'];

  const results = await Promise.all(
    endpoints.map(async endpoint => {
      try {
        const response = await fetch(`${process.env.NEXTAUTH_URL}${endpoint}`);
        return {
          endpoint,
          status: response.ok ? 'healthy' : 'unhealthy',
        };
      } catch (error) {
        return {
          endpoint,
          status: 'unhealthy',
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    })
  );

  return results;
}
