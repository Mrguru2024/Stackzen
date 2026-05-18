import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminSession } from '@/lib/api/require-admin';
import { maskEmail } from '@/lib/api/admin-pii';

export async function GET() {
  const { response } = await requireAdminSession();
  if (response) return response;

  try {
    const sessions = await prisma.userSession.findMany({
      where: { revokedAt: null },
      orderBy: { lastActiveAt: 'desc' },
      take: 200,
      include: {
        user: { select: { email: true } },
      },
    });

    const devices = sessions.map(session => ({
      id: session.id,
      userId: session.userId,
      userEmail: maskEmail(session.user.email),
      deviceId: session.id,
      userAgent: session.deviceLabel ?? 'Unknown',
      lastSeen: session.lastActiveAt,
      isTrusted: true,
      location: 'Unknown',
      ipAddress: null,
    }));

    return NextResponse.json(devices);
  } catch {
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
