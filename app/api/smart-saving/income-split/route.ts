import { NextResponse } from 'next/server';
import { createDatabaseService } from '@/lib/database';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = createDatabaseService();
    const user = await db.getUserByEmail(session.user.email);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get user's income split configuration
    const config = await db.getUserSetting(user.id, 'income_split_config');

    return NextResponse.json(
      config || {
        enabled: false,
        buckets: [],
        irregularIncomeMode: true,
        spikeThreshold: 50,
        dipThreshold: 30,
        autoAdjust: true,
      }
    );
  } catch (error) {
    console.error('Error fetching income split config:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = createDatabaseService();
    const user = await db.getUserByEmail(session.user.email);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const config = await request.json();

    // Validate configuration
    if (config.buckets) {
      const totalPercentage = config.buckets.reduce(
        (sum: number, bucket: any) => sum + bucket.percentage,
        0
      );
      if (totalPercentage !== 100) {
        return NextResponse.json({ error: 'Bucket percentages must equal 100%' }, { status: 400 });
      }
    }

    // Save configuration
    await db.setUserSetting(user.id, 'income_split_config', config);

    // If enabled, create or update smart buckets
    if (config.enabled && config.buckets) {
      for (const bucket of config.buckets) {
        await db.createSmartBucket(user.id, {
          name: bucket.name,
          type: bucket.type,
          percentage: bucket.percentage,
          color: bucket.color,
          priority: bucket.priority,
        });
      }
    }

    return NextResponse.json({ success: true, config });
  } catch (error) {
    console.error('Error saving income split config:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
