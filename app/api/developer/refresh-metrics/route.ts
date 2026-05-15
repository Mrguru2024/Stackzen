import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import Redis from 'ioredis';
import { PerformanceMonitor } from '@/lib/monitoring/performance';

const redis = new Redis(process.env.REDIS_URL!);

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Check if user is a developer
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== 'ADMIN' && user?.role !== 'SUPER_ADMIN') {
      return new NextResponse('Forbidden', { status: 403 });
    }

    // Get performance metrics
    const performanceMonitor = PerformanceMonitor.getInstance();
    const performanceMetrics = await performanceMonitor.collectMetrics();

    // Get recent errors
    const recentErrors = await prisma.errorLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        message: true,
        createdAt: true,
      },
    });

    const activeUsers = await prisma.user.count({
      where: {
        lastLogin: {
          gte: new Date(Date.now() - 5 * 60 * 1000),
        },
      },
    });

    // Get system health
    const systemHealth = {
      database: true, // Implement actual database health check
      redis: await redis
        .ping()
        .then(() => true)
        .catch(() => false),
      api: true, // Implement actual API health check
    };

    // Get recent deployments
    const recentDeployments = await prisma.deployment.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        status: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      totalErrors: recentErrors.length,
      recentErrors: recentErrors.map(error => ({
        id: error.id,
        message: error.message,
        timestamp: error.createdAt,
        severity: 'error' as const,
      })),
      activeUsers,
      systemHealth,
      recentDeployments: recentDeployments.map(deployment => ({
        id: deployment.id,
        version: deployment.status,
        status: deployment.status,
        timestamp: deployment.createdAt,
      })),
      performanceMetrics,
    });
  } catch (error) {
    console.error('Error refreshing metrics:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
