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
  if (!session.user.email) {
    throw new APIError(401, 'No email found in user session');
  }
}

export async function GET() {
  console.log('Dashboard stats API route called');
  try {
    const session = (await getServerSession(authOptions)) as SessionWithUser;

    // Validate session
    validateSession(session);

    console.log('Session validated for user:', session.user.email);

    // Get or create user's financial data
    let user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        accounts: true,
        services: true,
        bookings: true,
      },
    });

    if (!user) {
      console.log('Creating new user in database for:', session.user.email);
      try {
        user = await prisma.user.create({
          data: {
            email: session.user.email,
            name: session.user.name,
            image: session.user.image,
            id: session.user.id,
          },
          include: {
            accounts: true,
            services: true,
            bookings: true,
          },
        });
        console.log('Successfully created new user:', user.id);
      } catch (error) {
        console.error('Error creating user:', error);
        throw new APIError(500, 'Failed to create user in database');
      }
    }

    // Get active services and bookings
    const activeServices = user.services.filter(service => service.isProOnly === false);
    const activeBookings = user.bookings.filter(booking => booking.status === 'confirmed');

    // Calculate total balance from all accounts
    const totalBalance = user.accounts.reduce(
      (sum, account) => sum + (account.access_token ? 1 : 0),
      0
    );

    // Calculate monthly earnings (sum of service prices)
    const monthlyEarnings = user.services.reduce((sum, service) => sum + service.price, 0);

    // Get the previous month's data for comparison
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    try {
      const lastMonthBookings = await prisma.booking.count({
        where: {
          userId: user.id,
          createdAt: {
            gte: lastMonth,
          },
          status: 'completed',
        },
      });

      const lastMonthEarnings = lastMonthBookings * 100; // Assuming average booking is $100
      const earningsChange =
        lastMonthEarnings > 0
          ? ((monthlyEarnings - lastMonthEarnings) / lastMonthEarnings) * 100
          : 0;

      const bookingsChange =
        lastMonthBookings > 0
          ? ((activeBookings.length - lastMonthBookings) / lastMonthBookings) * 100
          : 0;

      return NextResponse.json({
        totalBalance,
        monthlyEarnings,
        activeServices: activeServices.length,
        activeBookings: activeBookings.length,
        earningsChange: Math.round(earningsChange * 100) / 100,
        bookingsChange: Math.round(bookingsChange * 100) / 100,
      });
    } catch (error) {
      console.error('Error fetching booking data:', error);
      throw new APIError(500, 'Failed to fetch booking data');
    }
  } catch (error) {
    console.error('Error in dashboard stats:', error);

    if (error instanceof APIError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
