import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { sessionId } = body;

    // Get the mentor session
    const mentorSession = await prisma.mentorSession.findUnique({
      where: { id: sessionId },
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

    if (!mentorSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Check if user is authorized for this session
    if (mentorSession.userId !== session.user.id) {
      // Check if user is the mentor
      const mentor = await prisma.mentor.findUnique({
        where: { userId: session.user.id },
      });

      if (!mentor || mentor.id !== mentorSession.mentorId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    // Create mock room URL (in production, this would create a Daily.co room)
    const roomName = `stackzen-${sessionId}`;
    const roomUrl = `https://stackzen.daily.co/${roomName}`;

    // Update session with meeting URL
    await prisma.mentorSession.update({
      where: { id: sessionId },
      data: {
        meetingUrl: roomUrl,
        meetingId: roomName,
      },
    });

    return NextResponse.json({
      roomUrl,
      roomName,
      session: mentorSession,
      note: 'This is a demo implementation. In production, this would create a real Daily.co room.',
    });
  } catch (error) {
    console.error('Error creating video room:', error);
    return NextResponse.json({ error: 'Failed to create video room' }, { status: 500 });
  }
}
