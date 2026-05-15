import { NextResponse } from 'next/server';
import { runScheduledFixedSavesForAllUsers } from '@/lib/financial-automation/run-scheduled-fixed-saves';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const summary = await runScheduledFixedSavesForAllUsers(new Date());
    return NextResponse.json({ ok: true, summary });
  } catch {
    console.error('[CRON_AUTOMATION_SCHEDULED_SAVES] failed');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
