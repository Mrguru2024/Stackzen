'use client';

import { useEffect, useRef } from 'react';

/**
 * Subscribes to Server-Sent Events for a mentor conversation (replaces polling).
 */
export function useMentorConversationStream(
  conversationId: string | null,
  streamUrl: string | null,
  onEvent: () => void
) {
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    if (!conversationId || !streamUrl) return;

    const source = new EventSource(streamUrl);

    source.onmessage = event => {
      try {
        const data = JSON.parse(event.data) as { type?: string };
        if (data.type === 'message') {
          onEventRef.current();
        }
      } catch {
        // ignore malformed payloads
      }
    };

    source.onerror = () => {
      source.close();
    };

    return () => {
      source.close();
    };
  }, [conversationId, streamUrl]);
}
