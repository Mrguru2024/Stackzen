import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { MentorApplicationStatus, SessionStatus, SessionType } from '@prisma/client';
import { z } from 'zod';
import { isMentorListedForBooking } from '@/lib/mentors/vetting';

const bookingSchema = z.object({
  mentorId: z.string().min(1),
  date: z.string().min(1),
  time: z.string().min(1),
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const mentors = await prisma.mentor.findMany({
      where: {
        isActive: true,
        isVerified: true,
        applicationStatus: MentorApplicationStatus.SETUP_COMPLETE,
      },
      select: {
        id: true,
        name: true,
        expertise: true,
        rating: true,
        totalSessions: true,
        bio: true,
        specialties: true,
        headshotUrl: true,
      },
      orderBy: [{ rating: 'desc' }, { totalSessions: 'desc' }],
      take: 20,
    });

    const upcomingSessions = await prisma.mentorSession.findMany({
      where: {
        userId: session.user.id,
        status: { in: [SessionStatus.SCHEDULED, SessionStatus.CONFIRMED] },
      },
      select: {
        id: true,
        mentorId: true,
        scheduledAt: true,
        status: true,
      },
      orderBy: { scheduledAt: 'asc' },
      take: 10,
    });

    const mapped = {
      mentors: mentors.map(mentor => ({
        id: mentor.id,
        name: mentor.name,
        specialization: mentor.specialties[0] ?? mentor.expertise[0] ?? 'General Financial Coaching',
        avatar: mentor.headshotUrl,
        rating: mentor.rating,
        sessionsCompleted: mentor.totalSessions,
        studentsHelped: mentor.totalSessions,
        bio: mentor.bio ?? 'Financial mentor available for one-on-one coaching.',
        expertise: mentor.expertise.length > 0 ? mentor.expertise : mentor.specialties,
      })),
      availableTimeSlots: ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'],
      upcomingSessions: upcomingSessions.map(item => ({
        id: item.id,
        mentorId: item.mentorId,
        date: item.scheduledAt.toISOString().slice(0, 10),
        time: item.scheduledAt.toISOString().slice(11, 16),
        status: item.status.toLowerCase(),
      })),
    };

    return NextResponse.json(mapped);
  } catch (error) {
    console.error('Error fetching mentorship data:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await request.json();
    const parsed = bookingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid booking payload' }, { status: 400 });
    }

    const mentor = await prisma.mentor.findFirst({
      where: { id: parsed.data.mentorId },
      select: { id: true, hourlyRate: true, isActive: true, isVerified: true, applicationStatus: true },
    });
    if (!mentor || !isMentorListedForBooking(mentor)) {
      return NextResponse.json({ error: 'Mentor not available' }, { status: 404 });
    }

    const scheduledAt = new Date(`${parsed.data.date}T${parsed.data.time}:00.000Z`);
    if (Number.isNaN(scheduledAt.getTime())) {
      return NextResponse.json({ error: 'Invalid date or time' }, { status: 400 });
    }

    const hourlyRate = mentor.hourlyRate ?? 80;
    const duration = 60;
    const price = Number(hourlyRate.toFixed(2));
    const platformFee = Number((price * 0.15).toFixed(2));
    const mentorPayout = Number((price - platformFee).toFixed(2));

    const newBooking = await prisma.mentorSession.create({
      data: {
        mentorId: mentor.id,
        userId: session.user.id,
        sessionType: SessionType.DIRECT_BOOKING,
        status: SessionStatus.SCHEDULED,
        scheduledAt,
        duration,
        price,
        platformFee,
        mentorPayout,
      },
      select: {
        id: true,
        mentorId: true,
        scheduledAt: true,
        status: true,
      },
    });

    return NextResponse.json({
      id: newBooking.id,
      mentorId: newBooking.mentorId,
      date: newBooking.scheduledAt.toISOString().slice(0, 10),
      time: newBooking.scheduledAt.toISOString().slice(11, 16),
      status: newBooking.status.toLowerCase(),
    });
  } catch (error) {
    console.error('Error creating mentorship booking:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
