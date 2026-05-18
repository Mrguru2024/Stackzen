import { NextResponse } from 'next/server';
import { requireAdminSession, logAdminAudit } from '@/lib/api/require-admin';
import { getClientIp } from '@/lib/api/rate-limit-request';
import { revokeUserSession } from '@/lib/security/user-session';

export async function POST(
  request: Request,
  context: { params: Promise<{ deviceId: string }> }
) {
  const { user, response } = await requireAdminSession();
  if (response || !user) return response;

  try {
    const { deviceId } = await context.params;
    const revoked = await revokeUserSession(deviceId, 'admin_revoke');

    if (!revoked) {
      return new NextResponse('Device not found', { status: 404 });
    }

    await logAdminAudit({
      adminUserId: user.id,
      action: 'admin.device.revoke',
      resource: deviceId,
      details: { sessionId: deviceId },
      ipAddress: getClientIp(request),
    });

    return NextResponse.json({ success: true });
  } catch {
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
