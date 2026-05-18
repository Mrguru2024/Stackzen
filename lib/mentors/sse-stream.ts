import 'server-only';
import { subscribeMentorConversation } from '@/lib/mentors/chat-bus';

export function createMentorConversationSseStream(
  conversationId: string,
  signal: AbortSignal
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();

  return new ReadableStream({
    start(controller) {
      const send = (payload: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
      };

      send({ type: 'connected', conversationId });

      const unsubscribe = subscribeMentorConversation(conversationId, event => {
        send(event);
      });

      const heartbeat = setInterval(() => {
        send({ type: 'ping' });
      }, 25000);

      const cleanup = () => {
        clearInterval(heartbeat);
        unsubscribe();
        try {
          controller.close();
        } catch {
          // already closed
        }
      };

      signal.addEventListener('abort', cleanup);
    },
  });
}

export function mentorConversationSseResponse(stream: ReadableStream<Uint8Array>): Response {
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
