import type { Mentor, MentorApplicationStatus, SessionStatus } from '@prisma/client';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isMentorListedForBooking } from '@/lib/mentors/vetting';

const ACTIVE_MENTEE_RELATION: SessionStatus[] = [
  'SCHEDULED',
  'CONFIRMED',
  'IN_PROGRESS',
  'COMPLETED',
];

export type MentorPortalContext = {
  userId: string;
  mentor: Mentor;
  canViewClientData: boolean;
  listedForBooking: boolean;
};

/** Fully vetted mentor allowed to see mentee activity insights (read-only, in-app). */
export function canViewMenteeClientData(
  mentor: Pick<Mentor, 'isVerified' | 'isActive' | 'applicationStatus'>
): boolean {
  return isMentorListedForBooking(mentor);
}

export async function loadMentorPortalContext(userId: string): Promise<MentorPortalContext | null> {
  const mentor = await prisma.mentor.findUnique({ where: { userId } });
  if (!mentor) return null;
  return {
    userId,
    mentor,
    canViewClientData: canViewMenteeClientData(mentor),
    listedForBooking: isMentorListedForBooking(mentor),
  };
}

export async function mentorHasMenteeRelationship(
  mentorId: string,
  memberUserId: string
): Promise<boolean> {
  const count = await prisma.mentorSession.count({
    where: {
      mentorId,
      userId: memberUserId,
      status: { in: ACTIVE_MENTEE_RELATION },
    },
  });
  return count > 0;
}

export async function assertMenteeAccess(
  ctx: MentorPortalContext,
  memberUserId: string
): Promise<NextResponse | null> {
  if (!ctx.canViewClientData) {
    return NextResponse.json(
      {
        error:
          'Client insights are available after you complete vetting and go live in the mentor directory.',
      },
      { status: 403 }
    );
  }

  const linked = await mentorHasMenteeRelationship(ctx.mentor.id, memberUserId);
  if (!linked) {
    return NextResponse.json(
      { error: 'No active mentoring relationship with this member.' },
      { status: 403 }
    );
  }

  return null;
}

export function mentorPortalForbidden(
  reason = 'Mentor profile required'
): NextResponse {
  return NextResponse.json({ error: reason }, { status: 403 });
}

export function applicationStatusLabel(status: MentorApplicationStatus): string {
  switch (status) {
    case 'PENDING_REVIEW':
      return 'Pending review';
    case 'APPROVED':
      return 'Approved — finish setup';
    case 'SETUP_COMPLETE':
      return 'Live';
    case 'REJECTED':
      return 'Rejected';
    default:
      return status;
  }
}
