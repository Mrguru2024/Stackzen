import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const userId = session.user.id;
    const [incomeAgg, expenseAgg, savingsGoals, challengeCount] = await Promise.all([
      prisma.income.aggregate({ where: { userId }, _sum: { amount: true } }),
      prisma.expense.aggregate({ where: { userId }, _sum: { amount: true } }),
      prisma.savingsGoal.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      prisma.savingsChallenge.count({ where: { userId } }),
    ]);

    const totalIncome = incomeAgg._sum.amount ?? 0;
    const totalExpenses = expenseAgg._sum.amount ?? 0;
    const savingsProgress = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;
    const emergencyGoal = savingsGoals[0];
    const emergencyPct = emergencyGoal
      ? Math.min(100, Math.round((emergencyGoal.currentAmount / emergencyGoal.targetAmount) * 100))
      : 0;

    const data = {
      milestones: [
        {
          id: 'income-tracking',
          title: 'Getting Started',
          description: 'Track your financial inflow/outflow consistently',
          criteria: 'Log at least one income and one expense entry',
          tip: 'Use recurring entries to reduce manual updates.',
          completed: totalIncome > 0 && totalExpenses > 0,
          completionPercentage: totalIncome > 0 || totalExpenses > 0 ? 100 : 0,
        },
        {
          id: 'emergency-fund',
          title: 'Build Emergency Fund',
          description: 'Grow a buffer goal for unexpected expenses',
          criteria: emergencyGoal
            ? `Save ${Math.round(emergencyGoal.targetAmount)} in ${emergencyGoal.name}`
            : 'Create a savings goal and fund it',
          tip: 'Start with a mini emergency fund before increasing target size.',
          completed: emergencyPct >= 100,
          completionPercentage: emergencyPct,
        },
        {
          id: 'challenge-consistency',
          title: 'Challenge Consistency',
          description: 'Participate in guided savings challenges',
          criteria: 'Join at least one savings challenge',
          tip: 'Challenge-based saving helps build consistency.',
          completed: challengeCount > 0,
          completionPercentage: challengeCount > 0 ? 100 : 0,
        },
      ],
      achievements: [
        {
          id: 'income-logged',
          title: 'Income Tracker Active',
          description: `Logged ${Math.round(totalIncome)} in tracked income`,
          date: new Date(),
        },
        {
          id: 'expense-awareness',
          title: 'Expense Awareness',
          description: `Tracked ${Math.round(totalExpenses)} in expenses`,
          date: new Date(),
        },
      ],
    };

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching financial journey data:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await request.json();
    const milestoneId = String(body?.milestoneId ?? '');
    const completed = Boolean(body?.completed);
    const completionPercentage = Number(body?.completionPercentage ?? 0);
    return NextResponse.json({ success: true, milestoneId, completed, completionPercentage });
  } catch (error) {
    console.error('Error updating financial journey data:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
