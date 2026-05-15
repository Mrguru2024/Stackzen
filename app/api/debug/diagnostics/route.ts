import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth-config';
import { notFoundInProduction } from '@/lib/api/production-gate';
import packageJson from '../../../../package.json';

export async function GET(req: NextRequest) {
  const blocked = notFoundInProduction();
  if (blocked) return blocked;

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    // Check if user is SUPER_ADMIN
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      select: { id: true, role: true, lastLogin: true },
    });
    if (user?.role !== 'SUPER_ADMIN') {
      return new NextResponse('Forbidden', { status: 403 });
    }

    // Get IP address
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      'unknown';

    // Get last 10 critical errors
    const criticalErrors = await prisma.errorLog.findMany({
      where: { createdAt: { gte: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000) } },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // System health (mocked or fetch from health endpoint)
    // You can replace this with a real fetch if you have a health API
    const systemHealth = {
      database: 'healthy',
      redis: 'healthy',
      api: [
        { endpoint: '/api', status: 'healthy' },
        { endpoint: '/api/auth', status: 'healthy' },
      ],
      lastChecked: new Date().toISOString(),
    };

    // App version and deployment info
    const appVersion = packageJson.version || 'unknown';
    const lastDeployment = process.env.LAST_DEPLOYED_AT || 'unknown';

    return NextResponse.json({
      session,
      sessionExpires: session.expires,
      user: {
        id: user.id,
        email: session.user.email,
        role: user.role,
        lastLogin: user.lastLogin || null,
      },
      ip,
      criticalErrors: criticalErrors.map(e => ({
        id: e.id,
        message: e.message,
        stack: e.stack,
        createdAt: e.createdAt,
      })),
      systemHealth,
      environment: process.env.NODE_ENV,
      appVersion,
      lastDeployment,
    });
  } catch (error) {
    console.error('Error fetching diagnostics:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
