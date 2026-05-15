import { NextResponse } from 'next/server';
import { verifyFeedToken } from '@/lib/timing-coordination/feed-token';
import { buildIcsFeed } from '@/lib/timing-coordination/ics-feed';
import { buildTimingCoordinationSnapshot } from '@/lib/timing-coordination/snapshot';

function feedSecret(): string | null {
  const secret = process.env.STACKZEN_FEED_TOKEN_SECRET;
  return typeof secret === 'string' && secret.length >= 16 ? secret : null;
}

/**
 * Public, HMAC-signed ICS subscription feed. Google Calendar (and any RFC 5545
 * client) can subscribe to this URL. Read-only — no autonomous mutation possible.
 */
export async function GET(request: Request) {
  const secret = feedSecret();
  if (!secret) {
    return NextResponse.json(
      { error: 'Calendar feed disabled: STACKZEN_FEED_TOKEN_SECRET not configured' },
      { status: 503 }
    );
  }

  const url = new URL(request.url);
  const token = url.searchParams.get('token');
  const verified = verifyFeedToken(token, secret);
  if (!verified) {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 404 });
  }

  const snap = await buildTimingCoordinationSnapshot(verified.userId);
  const ics = buildIcsFeed(snap.calendarEntries, {
    feedName: 'StackZen · Financial Timing',
    feedUrl: url.toString(),
    generatedAt: snap.generatedAt,
  });

  return new NextResponse(ics, {
    status: 200,
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Cache-Control': 'public, max-age=900',
      'X-StackZen-Entry-Count': String(snap.calendarEntries.length),
    },
  });
}
