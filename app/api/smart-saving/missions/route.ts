import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const [challenges, goalCount, incomeCount] = await Promise.all([
      prisma.savingsChallenge.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 12,
      }),
      prisma.savingsGoal.count({ where: { userId } }),
      prisma.income.count({
        where: {
          userId,
          date: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
      }),
    ]);

    const missions = challenges.map(challenge => {
      const progress = Math.min(challenge.currentAmount, challenge.targetAmount);
      const completionPct =
        challenge.targetAmount > 0 ? Math.min(100, (progress / challenge.targetAmount) * 100) : 0;

      return {
        id: challenge.id,
        title: challenge.title,
        description: challenge.description ?? 'Reach your savings target.',
        type: 'savings' as const,
        status: challenge.isActive ? 'active' : 'completed',
        progress,
        target: challenge.targetAmount,
        reward: {
          type: 'points' as const,
          value: Math.max(10, Math.round(challenge.targetAmount / 10)),
        },
        difficulty: completionPct < 40 ? 'hard' : completionPct < 75 ? 'medium' : 'easy',
        deadline: challenge.endDate.toISOString(),
        category: 'goals' as const,
      };
    });

    if (missions.length === 0) {
      missions.push(
        {
          id: 'generated-emergency',
          title: 'Start Emergency Cushion',
          description: 'Create your first challenge and save at least $100.',
          type: 'savings',
          status: 'active',
          progress: 0,
          target: 100,
          reward: { type: 'points' as const, value: 50 },
          difficulty: 'easy',
          category: 'goals',
          deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: 'generated-income-streak',
          title: 'Income Momentum',
          description: 'Record recurring income activity this month.',
          type: 'savings',
          status: 'active',
          progress: Math.min(incomeCount, 3),
          target: 3,
          reward: { type: 'points' as const, value: 25 },
          difficulty: 'medium',
          category: 'goals',
          deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: 'generated-goal-setup',
          title: 'Goal Setup Sprint',
          description: 'Set up and maintain at least one savings goal.',
          type: 'savings',
          status: goalCount > 0 ? 'completed' : 'active',
          progress: goalCount > 0 ? 1 : 0,
          target: 1,
          reward: { type: 'points' as const, value: 100 },
          difficulty: 'easy',
          category: 'goals',
          deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        }
      );
    }

    return NextResponse.json({ missions });
  } catch (error) {
    console.error('Error fetching zen missions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
