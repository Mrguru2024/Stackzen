import { requireAuthSession } from '@/lib/api/require-auth';
import { loadConversationParticipant } from '@/lib/mentors/messaging';
import {
  createMentorConversationSseStream,
  mentorConversationSseResponse,
} from '@/lib/mentors/sse-stream';

type RouteCtx = { params: Promise<{ conversationId: string }> };

export async function GET(request: Request, { params }: RouteCtx) {
  const { session, response } = await requireAuthSession();
  if (response) return response;

  const { conversationId } = await params;
  const participant = await loadConversationParticipant(conversationId, session.user.id);
  if (!participant || participant.role !== 'member') {
    return new Response('Not found', { status: 404 });
  }

  const stream = createMentorConversationSseStream(conversationId, request.signal);
  return mentorConversationSseResponse(stream);
}
