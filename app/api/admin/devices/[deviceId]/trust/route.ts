import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminSession, logAdminAudit } from '@/lib/api/require-admin';
import { getClientIp } from '@/lib/api/rate-limit-request';

/** Trust is a no-op for UserSession rows (active sessions are trusted). Kept for admin UI compatibility. */
export async function POST(
  request: Request,
  context: { params: Promise<{ deviceId: string }> }
) {
  const { user, response } = await requireAdminSession();
  if (response || !user) return response;

  try {
    const { deviceId } = await context.params;

    const session = await prisma.userSession.findFirst({
      where: { id: deviceId, revokedAt: null },
    });

    if (!session) {
      return new NextResponse('Device not found', { status: 404 });
    }

    await prisma.userSession.update({
      where: { id: deviceId },
      data: { lastActiveAt: new Date() },
    });

    await logAdminAudit({
      adminUserId: user.id,
      action: 'admin.device.trust',
      resource: deviceId,
      details: { sessionId: deviceId },
      ipAddress: getClientIp(request),
    });

    return NextResponse.json({ success: true });
  } catch {
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
