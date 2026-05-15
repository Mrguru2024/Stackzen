import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { getTrialStatus } from '@/lib/trial-management';

export async function GET(request: Request) {
  try {
    console.log('Headers in /api/trial/status:', request.headers);
    const session = await getServerSession(authOptions);
    console.log('Session in /api/trial/status:', session);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const trialStatus = await getTrialStatus(session.user.id);

    return NextResponse.json({
      success: true,
      trialStatus,
    });
  } catch (error) {
    console.error('Trial status error:', error);
    return NextResponse.json({ error: 'Failed to get trial status' }, { status: 500 });
  }
}
