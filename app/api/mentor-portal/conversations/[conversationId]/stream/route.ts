import { requireVettedMentorPortal } from '@/lib/mentors/require-mentor-portal';
import { loadConversationParticipant } from '@/lib/mentors/messaging';
import {
  createMentorConversationSseStream,
  mentorConversationSseResponse,
} from '@/lib/mentors/sse-stream';

type RouteCtx = { params: Promise<{ conversationId: string }> };

export async function GET(request: Request, { params }: RouteCtx) {
  const { ctx, response } = await requireVettedMentorPortal();
  if (response || !ctx) return response;

  const { conversationId } = await params;
  const participant = await loadConversationParticipant(conversationId, ctx.userId);
  if (!participant || participant.role !== 'mentor') {
    return new Response('Not found', { status: 404 });
  }

  const stream = createMentorConversationSseStream(conversationId, request.signal);
  return mentorConversationSseResponse(stream);
}
