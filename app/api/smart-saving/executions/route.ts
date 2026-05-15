import { NextRequest, NextResponse } from 'next/server';
import { createDatabaseService } from '@/lib/database';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    const db = createDatabaseService();
    const user = await db.getUserByEmail(session.user.email);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const executions = await db.getSavingsExecutions(user.id, limit);
    return NextResponse.json(executions);
  } catch (error) {
    console.error('Error fetching savings executions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
