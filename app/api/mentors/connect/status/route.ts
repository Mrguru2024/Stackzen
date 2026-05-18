import { NextResponse } from 'next/server';
import { requireMentorPortal } from '@/lib/mentors/require-mentor-portal';
import { getMentorConnectCachedStatus, syncMentorConnectedAccount } from '@/lib/stripe/mentor-connect';

export async function GET() {
  const { ctx, response } = await requireMentorPortal();
  if (response || !ctx) return response;

  try {
    const status = await getMentorConnectCachedStatus(ctx.userId);
    return NextResponse.json(status);
  } catch (error) {
    console.error('[mentor_connect_status_get]', error);
    return NextResponse.json({ error: 'Unable to load payout status' }, { status: 500 });
  }
}

export async function POST() {
  const { ctx, response } = await requireMentorPortal();
  if (response || !ctx) return response;

  try {
    const status = await syncMentorConnectedAccount(ctx.userId);
    return NextResponse.json(status);
  } catch (error) {
    console.error('[mentor_connect_status_post]', error);
    return NextResponse.json({ error: 'Unable to refresh payout status' }, { status: 500 });
  }
}
