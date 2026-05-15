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

    // Get all active services
    const activeServices = await prisma.service.findMany({
      where: {
        userId: session.user.id,
        isProOnly: false,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Get all confirmed bookings
    const confirmedBookings = await prisma.booking.findMany({
      where: {
        userId: session.user.id,
        status: 'confirmed',
      },
      include: {
        service: true,
      },
    });

    // Calculate progress metrics
    const totalServices = activeServices.length;
    const totalBookings = confirmedBookings.length;
    const totalRevenue = confirmedBookings.reduce(
      (sum, booking) => sum + (booking.service?.price || 0),
      0
    );

    // Create goals based on services and bookings
    const goals = [
      {
        id: 'services',
        title: 'Active Services',
        currentAmount: totalServices,
        targetAmount: 5, // Target of 5 active services
        percentComplete: Math.min((totalServices / 5) * 100, 100),
      },
      {
        id: 'bookings',
        title: 'Confirmed Bookings',
        currentAmount: totalBookings,
        targetAmount: 10, // Target of 10 confirmed bookings
        percentComplete: Math.min((totalBookings / 10) * 100, 100),
      },
      {
        id: 'revenue',
        title: 'Monthly Revenue',
        currentAmount: totalRevenue,
        targetAmount: 1000, // Target of $1000 monthly revenue
        percentComplete: Math.min((totalRevenue / 1000) * 100, 100),
      },
    ];

    return NextResponse.json(goals);
  } catch (error) {
    console.error('Error fetching progress:', error);

    if (error instanceof APIError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
