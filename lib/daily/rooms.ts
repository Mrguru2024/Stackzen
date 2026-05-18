import 'server-only';

const DAILY_API_BASE = 'https://api.daily.co/v1';

export type DailyRoomResult = {
  roomUrl: string;
  roomName: string;
  provider: 'cached' | 'daily-api' | 'template' | 'demo';
  note?: string;
};

function templateRoomUrl(roomName: string): string {
  const template = process.env.DAILY_ROOM_URL_TEMPLATE?.trim();
  if (template?.includes('{room}')) {
    return template.replace('{room}', roomName);
  }
  return `https://stackzen.daily.co/${roomName}`;
}

/**
 * Resolves a video room for a mentor session. Uses Daily REST API when DAILY_API_KEY is set;
 * otherwise falls back to DAILY_ROOM_URL_TEMPLATE or a demo-style URL.
 */
export async function ensureMentorSessionVideoRoom(input: {
  sessionId: string;
  meetingUrl?: string | null;
  meetingId?: string | null;
}): Promise<DailyRoomResult> {
  if (input.meetingUrl) {
    return {
      roomUrl: input.meetingUrl,
      roomName: input.meetingId ?? `stackzen-${input.sessionId}`,
      provider: 'cached',
    };
  }

  const roomName = `stackzen-${input.sessionId}`;
  const apiKey = process.env.DAILY_API_KEY?.trim();

  if (apiKey) {
    try {
      const createRes = await fetch(`${DAILY_API_BASE}/rooms`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: roomName,
          properties: {
            exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 14,
            enable_chat: true,
            start_video_off: false,
            start_audio_off: false,
          },
        }),
      });

      if (createRes.ok) {
        const room = (await createRes.json()) as { url?: string; name?: string };
        if (room.url) {
          return {
            roomUrl: room.url,
            roomName: room.name ?? roomName,
            provider: 'daily-api',
          };
        }
      }

      const getRes = await fetch(`${DAILY_API_BASE}/rooms/${encodeURIComponent(roomName)}`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      if (getRes.ok) {
        const room = (await getRes.json()) as { url?: string; name?: string };
        if (room.url) {
          return {
            roomUrl: room.url,
            roomName: room.name ?? roomName,
            provider: 'daily-api',
          };
        }
      }
    } catch (error) {
      console.error('[daily] room provisioning failed', error);
    }
  }

  const roomUrl = templateRoomUrl(roomName);
  return {
    roomUrl,
    roomName,
    provider: apiKey ? 'template' : 'demo',
    note: apiKey
      ? undefined
      : 'Set DAILY_API_KEY for authenticated Daily rooms; demo URL works for local testing.',
  };
}
