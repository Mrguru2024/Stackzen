import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import Redis from 'ioredis';
import { requireAdminSession } from '@/lib/api/require-admin';

const redis = new Redis(process.env.REDIS_URL!);

export async function GET(request: Request) {
  const { response } = await requireAdminSession();
  if (response) return response;

  try {
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const type = searchParams.get('type');
    const severity = searchParams.get('severity');

    // Get blocked IPs from Redis
    const blockedIPs = await redis.smembers('blocked_ips');
    const suspiciousIPs = await redis.smembers('suspicious_ips');

    // Get security events from audit logs
    const where: any = {};
    if (type) {
      where.action = type;
    }
    if (severity) {
      where.severity = severity;
    }

    // Get total count
    const total = await prisma.auditLog.count({ where });

    // Get events with pagination
    const events = await prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Format events
    const formattedEvents = events.map(event => {
      let type: 'block' | 'unblock' | 'suspicious' | 'attack';
      const reason = event.details;

      if (event.action.includes('block')) {
        type = 'block';
      } else if (event.action.includes('unblock')) {
        type = 'unblock';
      } else if (event.action.includes('suspicious')) {
        type = 'suspicious';
      } else {
        type = 'attack';
      }

      return {
        id: event.id,
        type,
        ipAddress: event.ipAddress,
        reason,
        timestamp: event.createdAt,
        severity: event.severity,
      };
    });

    return NextResponse.json({
      events: formattedEvents,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page,
        limit,
      },
      stats: {
        blockedIPs: blockedIPs.length,
        suspiciousIPs: suspiciousIPs.length,
      },
    });
  } catch (error) {
    console.error('Error fetching security events:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
