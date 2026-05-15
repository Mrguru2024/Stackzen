import { NextRequest, NextResponse } from 'next/server';
import { createDatabaseService } from '@/lib/database';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { SaveEngine } from '@/lib/saveEngine';

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
    const { type, amount, description, merchant, category } = body;

    const saveEngine = new SaveEngine(user.id);

    switch (type) {
      case 'roundup':
        await saveEngine.executeRoundUp(amount, description);
        break;
      case 'auto':
        await saveEngine.executeAutoSaver();
        break;
      case 'budget':
        if (category && amount) {
          await saveEngine.executeBudgetSaver(category, amount);
        }
        break;
      case 'trigger':
        if (merchant && amount) {
          await saveEngine.executeTriggerSave(merchant, amount);
        }
        break;
      case 'income_split':
        if (amount) {
          await saveEngine.executeIncomeSplit(amount);
        }
        break;
      default:
        return NextResponse.json({ error: 'Invalid rule type' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      databaseType: db.getDatabaseType(),
      message: `${type} rule executed successfully`,
    });
  } catch (error) {
    console.error('Error executing smart saving rule:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
