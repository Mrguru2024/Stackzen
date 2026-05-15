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

    // Get user's behavioral rules
    const rules = await db.getUserSetting(user.id, 'behavioral_rules');

    // Get user behavior profile
    const behavior = await db.getUserSetting(user.id, 'user_behavior');

    return NextResponse.json({
      rules: rules || [],
      behavior: behavior || null,
    });
  } catch (error) {
    console.error('Error fetching behavioral data:', error);
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

    const { rules, behavior } = await request.json();

    // Save behavioral rules
    if (rules) {
      await db.setUserSetting(user.id, 'behavioral_rules', rules);
    }

    // Save user behavior profile
    if (behavior) {
      await db.setUserSetting(user.id, 'user_behavior', behavior);
    }

    // Trigger behavioral analysis
    await analyzeUserBehavior(user.id, rules, behavior);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving behavioral data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function analyzeUserBehavior(userId: string, rules: any[], behavior: any) {
  try {
    // Analyze user behavior patterns
    const analysis = {
      userId,
      timestamp: new Date().toISOString(),
      activeRules: rules?.filter((r: any) => r.enabled).length || 0,
      averageIntensity:
        rules?.reduce((sum: number, r: any) => sum + r.intensity, 0) / (rules?.length || 1),
      behaviorType: behavior?.incomePattern || 'unknown',
      recommendations: generateRecommendations(rules, behavior),
    };

    // Save analysis
    const db = createDatabaseService();
    await db.setUserSetting(userId, 'behavior_analysis', analysis);

    console.log('Behavioral analysis completed:', analysis);
  } catch (error) {
    console.error('Error analyzing user behavior:', error);
  }
}

function generateRecommendations(rules: any[], behavior: any): string[] {
  const recommendations: string[] = [];

  if (!rules || rules.length === 0) {
    recommendations.push('Start with invisible round-up savings');
    recommendations.push('Enable income spike detection for irregular income');
    return recommendations;
  }

  const activeRules = rules.filter((r: any) => r.enabled);

  if (activeRules.length < 3) {
    recommendations.push('Enable more behavioral rules for better results');
  }

  if (behavior?.incomePattern === 'irregular' || behavior?.incomePattern === 'sporadic') {
    recommendations.push('Consider enabling income dip protection');
    recommendations.push('Use streak bonuses to maintain momentum during gaps');
  }

  if (behavior?.savingMotivation === 'security') {
    recommendations.push('Focus on emergency fund and tax buffer rules');
  }

  if (behavior?.savingMotivation === 'goals') {
    recommendations.push('Enable goal-based savings triggers');
  }

  return recommendations;
}
