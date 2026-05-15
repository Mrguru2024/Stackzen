import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import Redis from 'ioredis';
import { requireAdminSession } from '@/lib/api/require-admin';

const redis = new Redis(process.env.REDIS_URL!);

async function checkDatabaseHealth() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { status: 'healthy', latency: Date.now() };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function checkRedisHealth() {
  try {
    const start = Date.now();
    await redis.ping();
    return { status: 'healthy', latency: Date.now() - start };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function checkAPIEndpoints() {
  const endpoints = [
    '/api/auth/session',
    '/api/auth/csrf',
    '/api/auth/signin',
    '/api/auth/signout',
  ];

  const results = await Promise.all(
    endpoints.map(async endpoint => {
      try {
        const start = Date.now();
        const response = await fetch(`${process.env.NEXTAUTH_URL}${endpoint}`);
        const latency = Date.now() - start;
        return {
          endpoint,
          status: response.ok ? 'healthy' : 'unhealthy',
          statusCode: response.status,
          latency,
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

async function getSystemMetrics() {
  const [totalUsers, activeUsers, blockedIPs, suspiciousIPs, recentErrors, loginAttempts] =
    await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: {
          lastLogin: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
      }),
      redis.smembers('blocked_ips'),
      redis.smembers('suspicious_ips'),
      prisma.auditLog.findMany({
        where: {
          severity: 'error',
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 10,
      }),
      // Login attempts per day for last 15 days
      prisma.auditLog.findMany({
        where: {
          action: 'LOGIN_ATTEMPT',
          createdAt: {
            gte: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
          },
        },
        select: { createdAt: true },
      }),
    ]);

  // Group login attempts by day
  const now = new Date();
  const loginAttemptsByDay: Record<string, number> = {};
  for (let i = 14; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    loginAttemptsByDay[key] = 0;
  }
  loginAttempts.forEach((a: any) => {
    const key = new Date(a.createdAt).toISOString().slice(0, 10);
    if (loginAttemptsByDay[key] !== undefined) loginAttemptsByDay[key]++;
  });

  return {
    totalUsers,
    activeUsers,
    blockedIPs: blockedIPs.length,
    suspiciousIPs: suspiciousIPs.length,
    recentErrors,
    loginAttemptsByDay,
  };
}

export async function GET(_request: Request) {
  const { response } = await requireAdminSession();
  if (response) return response;

  try {
    const [databaseHealth, redisHealth, apiHealth, systemMetrics] = await Promise.all([
      checkDatabaseHealth(),
      checkRedisHealth(),
      checkAPIEndpoints(),
      getSystemMetrics(),
    ]);

    // API latency stats
    let apiLatencyStats = { avg: 0, min: 0, max: 0 };
    if (Array.isArray(apiHealth)) {
      const latencies = apiHealth
        .map((ep: any) => ep.latency)
        .filter((l: any) => typeof l === 'number');
      if (latencies.length) {
        apiLatencyStats = {
          avg: Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length),
          min: Math.min(...latencies),
          max: Math.max(...latencies),
        };
      }
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      services: {
        database: databaseHealth,
        redis: redisHealth,
        api: apiHealth,
      },
      metrics: systemMetrics,
      apiLatencyStats,
    });
  } catch (error) {
    console.error('Error checking system health:', error);
    if (process.env.NODE_ENV === 'development' && error instanceof Error) {
      return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 });
    }
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
