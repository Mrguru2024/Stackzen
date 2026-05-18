import 'server-only';

export type MentorChatEvent =
  | { type: 'message'; conversationId: string; messageId: string }
  | { type: 'ping' };

type Listener = (event: MentorChatEvent) => void;

const globalForChat = globalThis as typeof globalThis & {
  __mentorChatListeners?: Map<string, Set<Listener>>;
};

function channelMap(): Map<string, Set<Listener>> {
  if (!globalForChat.__mentorChatListeners) {
    globalForChat.__mentorChatListeners = new Map();
  }
  return globalForChat.__mentorChatListeners;
}

export function subscribeMentorConversation(
  conversationId: string,
  listener: Listener
): () => void {
  const map = channelMap();
  if (!map.has(conversationId)) {
    map.set(conversationId, new Set());
  }
  map.get(conversationId)!.add(listener);
  return () => {
    map.get(conversationId)?.delete(listener);
    if (map.get(conversationId)?.size === 0) {
      map.delete(conversationId);
    }
  };
}

export function publishMentorConversation(conversationId: string, event: MentorChatEvent): void {
  channelMap().get(conversationId)?.forEach(listener => {
    try {
      listener(event);
    } catch {
      // ignore subscriber errors
    }
  });
}
