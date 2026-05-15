import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const mentorId = searchParams.get('mentorId');
    const status = searchParams.get('status');

    const where: any = {};

    if (mentorId) {
      where.mentorId = mentorId;
    }

    if (status) {
      where.status = status;
    }

    // If user is a mentor, show their sessions
    const userMentor = await prisma.mentor.findUnique({
      where: { userId: session.user.id },
    });

    if (userMentor) {
      where.mentorId = userMentor.id;
    } else {
      where.userId = session.user.id;
    }

    const sessions = await prisma.mentorSession.findMany({
      where,
      include: {
        mentor: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
        user: {
          select: {
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: {
        scheduledAt: 'desc',
      },
    });

    return NextResponse.json(sessions);
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      mentorId,
      sessionType,
      scheduledAt,
      duration,
      price,
      goals,
      struggles,
      preferredTopics,
    } = body;

    // Validate mentor exists
    const mentor = await prisma.mentor.findUnique({
      where: { id: mentorId },
    });

    if (!mentor) {
      return NextResponse.json({ error: 'Mentor not found' }, { status: 404 });
    }

    // Calculate platform fees based on session type and price
    let platformFee = 0;
    let mentorPayout = 0;

    if (sessionType === 'STACKZEN_SESSION') {
      platformFee = 23; // $65 - $40 = $23
      mentorPayout = 40;
    } else {
      // Direct booking - tiered fees
      if (price <= 149) {
        platformFee = price * 0.099; // 9.9%
      } else if (price <= 299) {
        platformFee = price * 0.079; // 7.9%
      } else {
        platformFee = price * 0.049; // 4.9%
      }
      mentorPayout = price - platformFee;
    }

    const mentorSession = await prisma.mentorSession.create({
      data: {
        mentorId,
        userId: session.user.id,
        sessionType,
        scheduledAt: new Date(scheduledAt),
        duration,
        price,
        platformFee,
        mentorPayout,
        notes: `Goals: ${goals}
Struggles: ${struggles}
Topics: ${preferredTopics}`,
      },
      include: {
        mentor: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(mentorSession);
  } catch (error) {
    console.error('Error creating session:', error);
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
  }
}
