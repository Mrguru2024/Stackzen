import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest, { params }: { params: { sessionId: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sessionId } = params;
    const body = await request.json();
    const { rating, feedback } = body;

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Invalid rating' }, { status: 400 });
    }

    // Get the session and verify user owns it
    const mentorSession = await prisma.mentorSession.findUnique({
      where: { id: sessionId },
      include: {
        mentor: {
          include: {
            user: {
              select: { name: true },
            },
          },
        },
      },
    });

    if (!mentorSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (mentorSession.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (mentorSession.status !== 'COMPLETED') {
      return NextResponse.json({ error: 'Session must be completed to rate' }, { status: 400 });
    }

    // Update session with rating and feedback
    await prisma.mentorSession.update({
      where: { id: sessionId },
      data: {
        rating,
        feedback,
      },
    });

    // Update mentor average rating
    const mentorSessions = await prisma.mentorSession.findMany({
      where: {
        mentorId: mentorSession.mentorId,
        status: 'COMPLETED',
        rating: { not: null },
      },
      select: { rating: true },
    });

    const averageRating =
      mentorSessions.length === 0
        ? 0
        : mentorSessions.reduce((sum, s) => sum + (s.rating || 0), 0) / mentorSessions.length;

    await prisma.mentor.update({
      where: { id: mentorSession.mentorId },
      data: {
        rating: averageRating,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error submitting rating:', error);
    return NextResponse.json({ error: 'Failed to submit rating' }, { status: 500 });
  }
}
