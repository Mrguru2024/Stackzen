import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { calculateWellnessScore } from '@/lib/utils/wellness';
import { Prisma } from '@prisma/client';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      incomeData,
      debtData,
      savingsData,
      emergencyFund,
      goals,
      investmentPreferences,
      riskTolerance,
      financialLiteracy,
      lifeStage,
      familySize,
      location,
    } = body;

    const onboardingPersonalization: Prisma.InputJsonValue = {
      riskTolerance,
      financialLiteracy,
      lifeStage,
      familySize,
      location,
      investmentPreferences,
    };

    // Update user profile with comprehensive data
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        // Store additional user profile data
        userSettings: {
          upsert: {
            create: {
              currency: 'USD',
              emailNotifications: true,
              pushNotifications: true,
              weeklyReports: true,
              goalReminders: true,
              challengeUpdates: true,
              dashboardLayout: { onboardingPersonalization } as Prisma.InputJsonValue,
            },
            update: {
              dashboardLayout: { onboardingPersonalization } as Prisma.InputJsonValue,
            },
          },
        },
      },
    });

    // Create comprehensive wellness score
    const userFinancialData = {
      incomeData,
      savingsData,
      debtData,
      emergencyFund,
      investmentData: {
        growthRate: investmentPreferences?.growthRate || 0,
        diversification: investmentPreferences?.diversification || 0,
      },
      goals: goals.map((goal: any) => ({
        id: goal.id || Math.random().toString(),
        name: goal.name,
        target: goal.target,
        current: goal.current || 0,
        deadline: new Date(goal.deadline),
        category: goal.category,
        status: goal.status || 'active',
      })),
    };

    const wellnessScore = calculateWellnessScore(userFinancialData);

    // Save wellness score
    await prisma.wellnessScore.create({
      data: {
        userId: session.user.id,
        totalScore: wellnessScore.totalScore,
        status: wellnessScore.status,
        color: wellnessScore.color,
        description: wellnessScore.description,
        categoryScores: JSON.parse(JSON.stringify(wellnessScore.categoryScores)) as Prisma.InputJsonValue,
      },
    });

    // Save financial goals
    for (const goal of goals) {
      await prisma.financialGoal.create({
        data: {
          userId: session.user.id,
          name: goal.name,
          target: goal.target,
          current: goal.current || 0,
          deadline: new Date(goal.deadline),
          category: goal.category,
          status: goal.status || 'active',
        },
      });
    }

    // Save income allocation preferences
    if (incomeData?.allocation) {
      await prisma.budgetAllocation.createMany({
        data: [
          {
            userId: session.user.id,
            category: 'needs',
            amount: incomeData.allocation.needsTarget,
            period: 'monthly',
          },
          {
            userId: session.user.id,
            category: 'savings',
            amount: incomeData.allocation.savingsTarget,
            period: 'monthly',
          },
          {
            userId: session.user.id,
            category: 'investments',
            amount: incomeData.allocation.investmentsTarget,
            period: 'monthly',
          },
        ],
      });
    }

    return NextResponse.json({
      success: true,
      wellnessScore,
      message: 'Onboarding data saved successfully',
    });
  } catch (error) {
    console.error('Enhanced onboarding error:', error);
    return NextResponse.json({ error: 'Failed to save onboarding data' }, { status: 500 });
  }
}
