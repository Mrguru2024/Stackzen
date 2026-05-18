import { NextResponse } from 'next/server';
import { requireAuthSession } from '@/lib/api/require-auth';
import {
  loadMentorPortalContext,
  mentorPortalForbidden,
  type MentorPortalContext,
} from '@/lib/mentors/access';

export async function requireMentorPortal(): Promise<
  | { ctx: MentorPortalContext; response: null }
  | { ctx: null; response: NextResponse }
> {
  const { session, response } = await requireAuthSession();
  if (response) return { ctx: null, response };

  const ctx = await loadMentorPortalContext(session.user.id);
  if (!ctx) {
    return { ctx: null, response: mentorPortalForbidden() };
  }

  return { ctx, response: null };
}

export async function requireVettedMentorPortal(): Promise<
  | { ctx: MentorPortalContext; response: null }
  | { ctx: null; response: NextResponse }
> {
  const result = await requireMentorPortal();
  if (result.response || !result.ctx) return result;

  if (!result.ctx.canViewClientData) {
    return {
      ctx: null,
      response: NextResponse.json(
        {
          error:
            'Complete mentor vetting and setup before accessing client data, messaging, and live sessions.',
          applicationStatus: result.ctx.mentor.applicationStatus,
        },
        { status: 403 }
      ),
    };
  }

  return result;
}
