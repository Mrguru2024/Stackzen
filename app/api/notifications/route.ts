import { NextResponse } from 'next/server';
import type { AutomationNotification } from '@prisma/client';
import { requireAuthSession } from '@/lib/api/require-auth';
import { prisma } from '@/lib/prisma';

/**
 * Back-compat façade over `AutomationNotification` for callers still using `/api/notifications`.
 */
export function mapAutomationNotificationToLegacy(n: AutomationNotification) {
  return {
    id: n.id,
    title: n.title,
    message: `${n.title}: ${n.body}`,
    type: n.severity,
    read: Boolean(n.readAt),
    createdAt: n.createdAt,
    data: n.metadata ?? {},
  };
}

export async function GET() {
  const { session, response } = await requireAuthSession();
  if (response) return response;

  try {
    const notifications = await prisma.automationNotification.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return NextResponse.json(notifications.map(mapAutomationNotificationToLegacy));
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}
