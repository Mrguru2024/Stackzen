import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireVettedMentorPortal } from '@/lib/mentors/require-mentor-portal';
import { assertMenteeAccess } from '@/lib/mentors/access';

type RouteCtx = { params: Promise<{ userId: string }> };

/** Sanitized activity feed — no PII export, no bank details, no download. */
export async function GET(_req: Request, { params }: RouteCtx) {
  const { ctx, response } = await requireVettedMentorPortal();
  if (response || !ctx) return response;

  const { userId: memberUserId } = await params;
  const denied = await assertMenteeAccess(ctx, memberUserId);
  if (denied) return denied;

  const [member, sessions, events, goals] = await Promise.all([
    prisma.user.findUnique({
      where: { id: memberUserId },
      select: { id: true, name: true, image: true },
    }),
    prisma.mentorSession.findMany({
      where: { mentorId: ctx.mentor.id, userId: memberUserId },
      orderBy: { scheduledAt: 'desc' },
      take: 20,
      select: {
        id: true,
        sessionType: true,
        status: true,
        scheduledAt: true,
        duration: true,
      },
    }),
    prisma.financialEvent.findMany({
      where: { userId: memberUserId },
      orderBy: { createdAt: 'desc' },
      take: 25,
      select: {
        id: true,
        type: true,
        source: true,
        amount: true,
        createdAt: true,
        metadata: true,
      },
    }),
    prisma.operationalGoal.findMany({
      where: { userId: memberUserId, status: 'ACTIVE' },
      take: 10,
      select: {
        id: true,
        name: true,
        status: true,
        targetAmount: true,
        targetDate: true,
      },
    }),
  ]);

  if (!member) {
    return NextResponse.json({ error: 'Member not found' }, { status: 404 });
  }

  const activityLog = [
    ...sessions.map(s => ({
      id: `session-${s.id}`,
      kind: 'mentor_session' as const,
      label: `${s.sessionType.replace(/_/g, ' ')} — ${s.status}`,
      at: s.scheduledAt.toISOString(),
      detail: `${s.duration} min`,
    })),
    ...events.map(e => ({
      id: `event-${e.id}`,
      kind: 'financial_signal' as const,
      label: e.type.replace(/_/g, ' '),
      at: e.createdAt.toISOString(),
      detail:
        e.amount != null
          ? `Amount band: ${e.amount >= 1000 ? '$1k+' : e.amount >= 100 ? '$100–$999' : 'under $100'}`
          : 'Summary only',
    })),
    ...goals.map(g => ({
      id: `goal-${g.id}`,
      kind: 'goal' as const,
      label: g.name,
      at: (g.targetDate ?? new Date()).toISOString(),
      detail: `Target: $${Math.round(g.targetAmount)}`,
    })),
  ].sort((a, b) => b.at.localeCompare(a.at));

  return NextResponse.json(
    {
      member: { id: member.id, name: member.name, image: member.image },
      activityLog: activityLog.slice(0, 40),
      readOnly: true,
      exportDisabled: true,
      dataPolicy:
        'High-level signals only. Mentors cannot download or export member data. Unvetted mentors cannot access this view.',
    },
    {
      headers: {
        'Cache-Control': 'private, no-store',
        'Content-Disposition': 'inline',
      },
    }
  );
}
