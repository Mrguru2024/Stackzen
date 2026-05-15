import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { emailService } from '@/lib/email/emailService';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type, sessionId, mentorId } = body;

    switch (type) {
      case 'session_confirmation':
        await handleSessionConfirmation(sessionId);
        break;
      case 'session_reminder':
        await handleSessionReminder(sessionId);
        break;
      case 'session_completed':
        await handleSessionCompleted(sessionId);
        break;
      case 'mentor_application_received':
        await handleMentorApplicationReceived(mentorId);
        break;
      case 'mentor_application_approved':
        await handleMentorApplicationApproved(mentorId);
        break;
      default:
        return NextResponse.json({ error: 'Invalid notification type' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending notification:', error);
    return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 });
  }
}

async function handleSessionConfirmation(sessionId: string) {
  const session = await prisma.mentorSession.findUnique({
    where: { id: sessionId },
    include: {
      user: { select: { name: true, email: true } },
      mentor: {
        include: {
          user: { select: { name: true } },
        },
      },
    },
  });

  if (!session || !session.user?.email) {
    throw new Error('Session or user not found');
  }

  await emailService.sendSessionConfirmation(
    session.user.email,
    session.user.name || 'User',
    session.mentor.user?.name || 'Mentor',
    session
  );
}

async function handleSessionReminder(sessionId: string) {
  const session = await prisma.mentorSession.findUnique({
    where: { id: sessionId },
    include: {
      user: { select: { name: true, email: true } },
      mentor: {
        include: {
          user: { select: { name: true } },
        },
      },
    },
  });

  if (!session || !session.user?.email) {
    throw new Error('Session or user not found');
  }

  await emailService.sendSessionReminder(
    session.user.email,
    session.user.name || 'User',
    session.mentor.user?.name || 'Mentor',
    session
  );
}

async function handleSessionCompleted(sessionId: string) {
  const session = await prisma.mentorSession.findUnique({
    where: { id: sessionId },
    include: {
      user: { select: { name: true, email: true } },
      mentor: {
        include: {
          user: { select: { name: true } },
        },
      },
    },
  });

  if (!session || !session.user?.email) {
    throw new Error('Session or user not found');
  }

  await emailService.sendSessionCompleted(
    session.user.email,
    session.user.name || 'User',
    session.mentor.user?.name || 'Mentor',
    session
  );
}

async function handleMentorApplicationReceived(mentorId: string) {
  const mentor = await prisma.mentor.findUnique({
    where: { id: mentorId },
    include: {
      user: { select: { name: true, email: true } },
    },
  });

  if (!mentor || !mentor.user?.email) {
    throw new Error('Mentor not found');
  }

  await emailService.sendMentorApplicationReceived(
    mentor.user.email,
    mentor.user.name || 'Mentor',
    mentor.id
  );
}

async function handleMentorApplicationApproved(mentorId: string) {
  const mentor = await prisma.mentor.findUnique({
    where: { id: mentorId },
    include: {
      user: { select: { name: true, email: true } },
    },
  });

  if (!mentor || !mentor.user?.email) {
    throw new Error('Mentor not found');
  }

  const nextSteps = `
    <ol>
      <li>Complete your Stripe Connect onboarding</li>
      <li>Set your availability calendar</li>
      <li>Create your first session</li>
      <li>Start accepting bookings!</li>
    </ol>
  `;

  await emailService.sendMentorApplicationApproved(
    mentor.user.email,
    mentor.user.name || 'Mentor',
    nextSteps
  );
}
