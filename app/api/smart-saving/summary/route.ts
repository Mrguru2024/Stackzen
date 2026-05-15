import { NextResponse } from 'next/server';
import { createDatabaseService } from '@/lib/database';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { SaveEngine } from '@/lib/saveEngine';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = createDatabaseService();
    console.log(`Using database: ${db.getDatabaseType()}`);

    const user = await db.getUserByEmail(session.user.email);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const saveEngine = new SaveEngine(user.id);
    const weeklySummary = await saveEngine.getWeeklySummary();
    const bucketStatus = await saveEngine.getBucketStatus();

    // Get active rules count
    const rules = await db.getSavingsRules(user.id);
    const activeRules = rules.length;

    // Get recent executions (last 5)
    const recentExecutions = await db.getSavingsExecutions(user.id, 5);

    const summary = {
      weeklySummary,
      bucketStatus,
      activeRules,
      recentExecutions,
      totalBuckets: bucketStatus.length,
      totalSaved: weeklySummary.totalSaved,
      databaseType: db.getDatabaseType(),
    };

    return NextResponse.json(summary);
  } catch (error) {
    console.error('Error fetching smart saving summary:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
