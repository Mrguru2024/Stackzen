import { NextResponse } from 'next/server';
import { requireAuthSession } from '@/lib/api/require-auth';
import { provisionSessionVideoRoomForMember } from '@/lib/mentors/session-room';

type RouteCtx = { params: Promise<{ sessionId: string }> };

export async function POST(_req: Request, { params }: RouteCtx) {
  const { session, response } = await requireAuthSession();
  if (response) return response;

  const { sessionId } = await params;
  const result = await provisionSessionVideoRoomForMember(sessionId, session.user.id);

  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: 404 });
  }

  return NextResponse.json(result);
}
