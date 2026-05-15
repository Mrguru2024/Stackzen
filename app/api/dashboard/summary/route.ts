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

    // Get total income from completed bookings
    const completedBookings = await prisma.booking.findMany({
      where: {
        userId: session.user.id,
        status: 'completed',
      },
      select: {
        service: {
          select: {
            price: true,
          },
        },
      },
    });

    // Calculate total income from completed bookings
    const totalIncome = completedBookings.reduce(
      (sum, booking) => sum + (booking.service?.price || 0),
      0
    );

    // Get total expenses from services
    const expensesData = await prisma.service.aggregate({
      _sum: {
        price: true,
      },
      where: {
        userId: session.user.id,
      },
    });

    return NextResponse.json({
      income: totalIncome,
      expenses: expensesData._sum.price || 0,
    });
  } catch (error) {
    console.error('Error fetching dashboard summary:', error);

    if (error instanceof APIError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
