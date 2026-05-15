import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { calculateWellnessScore, generateRecommendations } from '@/lib/utils/wellness';
import { UserFinancialData } from '@/lib/types/wellness';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get latest wellness score
    const latestScore = await prisma.wellnessScore.findFirst({
      where: { userId: session.user.id },
      orderBy: { timestamp: 'desc' },
    });

    // Get user's financial goals
    const goals = await prisma.financialGoal.findMany({
      where: { userId: session.user.id },
    });

    return NextResponse.json({ score: latestScore, goals });
  } catch (error) {
    console.error('Error fetching wellness data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const userData: UserFinancialData = data.userData;

    // Calculate wellness score
    const score = calculateWellnessScore(userData);
    const recommendations = generateRecommendations(score);

    // Save to database
    const savedScore = await prisma.wellnessScore.create({
      data: {
        userId: session.user.id,
        totalScore: score.totalScore,
        status: score.status,
        color: score.color,
        description: score.description,
        categoryScores: score.categoryScores as unknown as Prisma.InputJsonValue,
        recommendations: recommendations as unknown as Prisma.InputJsonValue,
      },
    });

    return NextResponse.json(savedScore);
  } catch (error) {
    console.error('Error saving wellness score:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
