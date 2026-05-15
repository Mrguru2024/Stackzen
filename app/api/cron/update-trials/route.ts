import { NextResponse } from 'next/server';
import { getExpiredTrials, updateTrialStatus } from '@/lib/trial-management';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const expiredUserIds = await getExpiredTrials();

    const results: { userId: string; status: string }[] = [];
    for (const userId of expiredUserIds) {
      try {
        await updateTrialStatus(userId);
        results.push({ userId, status: 'updated' });
      } catch {
        console.error('[cron/update-trials] failed for user');
        results.push({ userId, status: 'failed' });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Updated ${results.filter(r => r.status === 'updated').length} expired trials`,
      results,
    });
  } catch {
    console.error('Cron job error');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/** Same auth as POST — do not expose trial user ids without cron secret. */
export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const expiredUserIds = await getExpiredTrials();

    return NextResponse.json({
      success: true,
      expiredTrials: expiredUserIds.length,
    });
  } catch {
    console.error('Get expired trials error');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
