import { NextResponse } from 'next/server';
import { requireAuthSession } from '@/lib/api/require-auth';
import { signFeedToken } from '@/lib/timing-coordination/feed-token';

function feedSecret(): string | null {
  const secret = process.env.STACKZEN_FEED_TOKEN_SECRET;
  return typeof secret === 'string' && secret.length >= 16 ? secret : null;
}

function originFor(request: Request): string {
  const candidates = [
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.NEXTAUTH_URL,
  ].filter((v): v is string => typeof v === 'string' && v.length > 0);
  for (const candidate of candidates) {
    try {
      return new URL(candidate).origin;
    } catch {
      continue;
    }
  }
  try {
    return new URL(request.url).origin;
  } catch {
    return 'http://localhost:3000';
  }
}

/**
 * Mint a signed Google Calendar subscription URL for the current user.
 *
 * Read-only. Calling POST again issues a fresh token; the previous URL
 * keeps working until its TTL expires (180 days). To force-revoke all
 * outstanding URLs, rotate `STACKZEN_FEED_TOKEN_SECRET` on the server —
 * every previously-issued signature stops validating immediately.
 */
export async function POST(request: Request) {
  const { session, response } = await requireAuthSession();
  if (response) return response;

  const secret = feedSecret();
  if (!secret) {
    return NextResponse.json(
      {
        error:
          'Calendar feed disabled: server is missing STACKZEN_FEED_TOKEN_SECRET (>=16 chars). Set it in your environment and restart.',
        configured: false,
      },
      { status: 503 }
    );
  }

  const token = signFeedToken(session.user.id, secret);
  const origin = originFor(request);
  return NextResponse.json({
    token,
    feedUrl: `${origin}/api/timing-coordination/calendar.ics?token=${encodeURIComponent(token)}`,
    expiresInDays: 180,
    configured: true,
    rotationHint: 'POST again to mint a new URL. Rotate STACKZEN_FEED_TOKEN_SECRET to revoke all outstanding URLs.',
  });
}

/**
 * Status check used by the UI before showing the "Subscribe" button.
 * Returns whether the server is configured to issue feed tokens.
 */
export async function GET() {
  const { response } = await requireAuthSession();
  if (response) return response;
  return NextResponse.json({ configured: feedSecret() !== null });
}
