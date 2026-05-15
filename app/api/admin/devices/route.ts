import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import Redis from 'ioredis';
import { requireAdminSession } from '@/lib/api/require-admin';

const redis = new Redis(process.env.REDIS_URL!);

export async function GET() {
  const { response } = await requireAdminSession();
  if (response) return response;

  try {
    const deviceKeys = await redis.keys('device:*');
    const devices = await Promise.all(
      deviceKeys.map(async key => {
        const deviceData = await redis.hgetall(key);
        const userId = key.split(':')[1];
        const u = await prisma.user.findUnique({
          where: { id: userId },
          select: { email: true },
        });

        return {
          id: deviceData.id,
          userId,
          userEmail: u?.email,
          deviceId: deviceData.deviceId,
          userAgent: deviceData.userAgent,
          lastSeen: new Date(deviceData.lastSeen),
          isTrusted: deviceData.isTrusted === 'true',
          location: deviceData.location || 'Unknown',
          ipAddress: deviceData.ipAddress,
        };
      })
    );

    return NextResponse.json(devices);
  } catch {
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
