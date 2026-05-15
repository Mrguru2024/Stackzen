import { NextRequest, NextResponse } from 'next/server';
import { createDatabaseService } from '@/lib/database';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use environment variable to determine database choice
    const db = createDatabaseService();
    console.log(`Using database: ${db.getDatabaseType()}`);

    const user = await db.getUserByEmail(session.user.email);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const rules = await db.getSavingsRules(user.id);
    return NextResponse.json(rules);
  } catch (error) {
    console.error('Error fetching savings rules:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { name, type, config } = body;

    const rule = await db.createSavingsRule(user.id, {
      name,
      type,
      config,
    });

    return NextResponse.json(rule);
  } catch (error) {
    console.error('Error creating savings rule:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
