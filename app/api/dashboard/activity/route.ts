import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { Session } from 'next-auth';

// Custom error class for API errors
class APIError extends Error {
  readonly statusCode: number;
  constructor(statusCode: number, message: string) {
    super(message);
    this.name = 'APIError';
    this.statusCode = statusCode;
  }
}

// Type for the session with user data
type SessionWithUser = Session & {
  user: {
    id: string;
    email: string;
    name: string;
    image?: string;
  };
};

// Validate session and user data
function validateSession(session: SessionWithUser | null): asserts session is SessionWithUser {
  if (!session) {
    throw new APIError(401, 'No session found');
  }
  if (!session.user) {
    throw new APIError(401, 'No user found in session');
  }
  if (!session.user.id) {
    throw new APIError(401, 'No user ID found in session');
  }
}

export async function GET() {
  try {
    const session = (await getServerSession(authOptions)) as SessionWithUser;
    validateSession(session);

    const recentActivity = await prisma.booking.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        service: true,
      },
    });

    return NextResponse.json({
      transactions: recentActivity.map(booking => ({
        id: booking.id,
        type: 'booking',
        amount: booking.service?.price || 0,
        description: booking.service?.title || 'Service Booking',
        status: booking.status,
        date: booking.date,
        time: booking.time,
      })),
    });
  } catch (error) {
    console.error('Error fetching recent activity:', error);

    if (error instanceof APIError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
