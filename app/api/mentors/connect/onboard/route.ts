import { NextResponse } from 'next/server';
import { requireMentorPortal } from '@/lib/mentors/require-mentor-portal';
import { createMentorOnboardingLink } from '@/lib/stripe/mentor-connect';
import { responseIfConnectNotEnabled } from '@/lib/stripe/connect-onboarding-errors';

export async function POST() {
  const { ctx, response } = await requireMentorPortal();
  if (response || !ctx) return response;

  try {
    const url = await createMentorOnboardingLink(ctx.userId);
    return NextResponse.json({ url });
  } catch (error) {
    console.error('[mentor_connect_onboard]', error);
    const notEnabled = responseIfConnectNotEnabled(error);
    if (notEnabled) return notEnabled;
    return NextResponse.json({ error: 'Unable to start payout onboarding' }, { status: 500 });
  }
}
