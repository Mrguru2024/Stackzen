import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await req.json();
    const { format: _format, dateRange, startDate, endDate, dataTypes } = body;

    // Calculate date range
    let dateFilter = {};
    if (dateRange !== 'all') {
      const now = new Date();
      let start = new Date();

      switch (dateRange) {
        case 'last30':
          start.setDate(now.getDate() - 30);
          break;
        case 'last90':
          start.setDate(now.getDate() - 90);
          break;
        case 'last365':
          start.setDate(now.getDate() - 365);
          break;
        case 'custom':
          if (startDate && endDate) {
            start = new Date(startDate);
            const end = new Date(endDate);
            dateFilter = {
              date: {
                gte: start,
                lte: end,
              },
            };
          }
          break;
      }

      if (dateRange !== 'custom') {
        dateFilter = {
          date: {
            gte: start,
            lte: now,
          },
        };
      }
    }

    // Fetch data based on selected types
    const data: any[] = [];

    if (dataTypes.includes('expenses')) {
      const expenses = await prisma.expense.findMany({
        where: {
          userId: session.user.id,
          ...dateFilter,
        },
        select: {
          id: true,
          amount: true,
          category: true,
          description: true,
          date: true,
          createdAt: true,
        },
      });
      data.push(...expenses.map(e => ({ ...e, type: 'expense' })));
    }

    if (dataTypes.includes('income')) {
      const income = await prisma.income.findMany({
        where: {
          userId: session.user.id,
          ...dateFilter,
        },
        select: {
          id: true,
          amount: true,
          source: true,
          notes: true,
          date: true,
          createdAt: true,
        },
      });
      data.push(...income.map(i => ({ ...i, type: 'income' })));
    }

    if (dataTypes.includes('goals')) {
      const goals = await prisma.financialGoal.findMany({
        where: {
          userId: session.user.id,
        },
        select: {
          id: true,
          name: true,
          target: true,
          current: true,
          deadline: true,
          createdAt: true,
        },
      });
      data.push(...goals.map(g => ({ ...g, title: g.name, type: 'goal' })));
    }

    if (dataTypes.includes('challenges')) {
      const challenges = await prisma.savingsChallenge.findMany({
        where: {
          userId: session.user.id,
        },
        select: {
          id: true,
          title: true,
          description: true,
          startDate: true,
          endDate: true,
          targetAmount: true,
          createdAt: true,
        },
      });
      data.push(
        ...challenges.map(c => ({
          ...c,
          target: c.targetAmount,
          type: 'challenge' as const,
        }))
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('[EXPORT]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
