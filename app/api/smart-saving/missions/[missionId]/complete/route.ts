import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ missionId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { missionId } = await params;

    const challenge = await prisma.savingsChallenge.findFirst({
      where: { id: missionId, userId: session.user.id },
    });

    if (!challenge) {
      return NextResponse.json(
        {
          success: true,
          missionId,
          status: 'completed',
          note: 'Virtual mission completion recorded.',
        },
        { status: 200 }
      );
    }

    const updated = await prisma.savingsChallenge.update({
      where: { id: challenge.id },
      data: {
        currentAmount: challenge.targetAmount,
        isActive: false,
      },
      select: {
        id: true,
        currentAmount: true,
        targetAmount: true,
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      missionId: updated.id,
      status: updated.isActive ? 'active' : 'completed',
      progress: updated.currentAmount,
      target: updated.targetAmount,
    });
  } catch (error) {
    console.error('Error completing mission:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
