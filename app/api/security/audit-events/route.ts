import { NextResponse } from 'next/server';
import { requireAuthSession } from '@/lib/api/require-auth';
import { SecurityAudit, type SecurityEventSeverity, type SecurityEventType } from '@/lib/auth/security-audit';
import { logSafeError } from '@/lib/security/safe-log';

/**
 * User-scoped audit log read API (Prisma). Immutable — GET only.
 */
export async function GET(request: Request) {
  const { session, response } = await requireAuthSession();
  if (response) return response;

  try {
    const { searchParams } = new URL(request.url);
    const limit = Number.parseInt(searchParams.get('limit') || '50', 10);
    const offset = Number.parseInt(searchParams.get('offset') || '0', 10);
    const eventType = searchParams.get('eventType') as SecurityEventType | 'all' | null;
    const severity = searchParams.get('severity') as SecurityEventSeverity | 'all' | null;
    const includeStats = searchParams.get('stats') === 'true';

    const events = await SecurityAudit.getEvents(session.user.id, {
      eventTypes: eventType && eventType !== 'all' ? [eventType] : undefined,
      severity: severity && severity !== 'all' ? [severity] : undefined,
      limit,
      offset,
    });

    const payload: Record<string, unknown> = { events };

    if (includeStats) {
      payload.stats = await SecurityAudit.getEventStats(session.user.id);
    }

    return NextResponse.json(payload);
  } catch (error) {
    logSafeError('SECURITY_AUDIT_EVENTS', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export async function PATCH() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
