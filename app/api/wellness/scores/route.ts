import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import type { WellnessScore } from '@/lib/types/wellness';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rows = await prisma.wellnessScore.findMany({
      where: { userId: session.user.id },
      orderBy: { timestamp: 'desc' },
      take: 48,
    });

    const scores: WellnessScore[] = rows.map(row => ({
      totalScore: row.totalScore,
      status: row.status as WellnessScore['status'],
      color: row.color,
      description: row.description,
      categoryScores: row.categoryScores as unknown as WellnessScore['categoryScores'],
      timestamp: row.timestamp.toISOString(),
    }));

    return NextResponse.json(scores);
  } catch (error) {
    console.error('Error fetching wellness scores:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
