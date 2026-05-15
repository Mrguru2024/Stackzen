import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    const data = await req.json();
    const { income, allocation, goals, bankConnected } = data;

    if (
      typeof income !== 'number' ||
      !allocation ||
      typeof allocation.needs !== 'number' ||
      typeof allocation.wants !== 'number' ||
      typeof allocation.savings !== 'number' ||
      !Array.isArray(goals) ||
      typeof bankConnected !== 'boolean'
    ) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
    }

    const onboardingLayout: Prisma.InputJsonValue = {
      onboarding: {
        allocation: {
          needs: allocation.needs,
          wants: allocation.wants,
          savings: allocation.savings,
        },
        bankConnected,
      },
    };

    await prisma.userSettings.upsert({
      where: { userId },
      update: {
        dashboardLayout: onboardingLayout,
      },
      create: {
        userId,
        dashboardLayout: onboardingLayout,
      },
    });

    await prisma.income.create({
      data: {
        userId,
        amount: income,
        source: 'onboarding',
        notes: 'Recorded from onboarding',
      },
    });

    if (goals.length > 0) {
      const deadline = new Date();
      deadline.setFullYear(deadline.getFullYear() + 1);

      await prisma.financialGoal.createMany({
        data: goals.map((title: string) => ({
          userId,
          name: title,
          target: 0,
          current: 0,
          deadline,
          category: 'general',
          status: 'active',
        })),
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Onboarding API error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const settings = await prisma.userSettings.findUnique({
      where: { userId: session.user.id },
      select: { dashboardLayout: true },
    });

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Onboarding GET error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
