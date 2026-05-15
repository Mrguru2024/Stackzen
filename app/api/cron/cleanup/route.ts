import { NextResponse } from 'next/server';
import { sendDeletionReminders, cleanupDeletedAccounts } from '@/lib/scheduled-tasks';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await sendDeletionReminders();
    await cleanupDeletedAccounts();

    return NextResponse.json({
      message: 'Cleanup tasks completed successfully',
    });
  } catch {
    console.error('[CRON_CLEANUP] failed');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
