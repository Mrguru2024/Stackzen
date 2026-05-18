import { NextResponse } from 'next/server';
import { requireVettedMentorPortal } from '@/lib/mentors/require-mentor-portal';
import { provisionSessionVideoRoom } from '@/lib/mentors/session-room';

type RouteCtx = { params: Promise<{ sessionId: string }> };

export async function POST(_req: Request, { params }: RouteCtx) {
  const { ctx, response } = await requireVettedMentorPortal();
  if (response || !ctx) return response;

  const { sessionId } = await params;
  const result = await provisionSessionVideoRoom(sessionId, ctx.mentor.id);

  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: 404 });
  }

  return NextResponse.json(result);
}
