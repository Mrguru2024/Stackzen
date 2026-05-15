import { NextResponse } from 'next/server';
import Redis from 'ioredis';
import { requireAdminSession, logAdminAudit } from '@/lib/api/require-admin';
import { getClientIp } from '@/lib/api/rate-limit-request';

const redis = new Redis(process.env.REDIS_URL!);

export async function POST(
  request: Request,
  context: { params: Promise<{ deviceId: string }> }
) {
  const { user, response } = await requireAdminSession();
  if (response || !user) return response;

  try {
    const { deviceId } = await context.params;

    const deviceKeys = await redis.keys(`device:*:${deviceId}`);
    if (deviceKeys.length === 0) {
      return new NextResponse('Device not found', { status: 404 });
    }

    const deviceKey = deviceKeys[0];
    await redis.hset(deviceKey, 'isTrusted', 'true');

    await logAdminAudit({
      adminUserId: user.id,
      action: 'admin.device.trust',
      resource: deviceId,
      details: { deviceId, trusted: true },
      ipAddress: getClientIp(request),
    });

    return NextResponse.json({ success: true });
  } catch {
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
