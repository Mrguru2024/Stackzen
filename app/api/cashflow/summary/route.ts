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

    // Get current month's start and end dates
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Get total income from completed bookings this month
    const monthlyIncome = await prisma.booking.count({
      where: {
        userId: session.user.id,
        status: 'completed',
        date: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
    });

    // Get total expenses from services this month
    const monthlyExpenses = await prisma.service.aggregate({
      _sum: {
        price: true,
      },
      where: {
        userId: session.user.id,
        createdAt: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
    });

    // Calculate net cash flow (assuming each booking is worth $100)
    const netCashFlow = monthlyIncome * 100 - (monthlyExpenses._sum.price || 0);

    // Format the period as a string
    const period = `${startOfMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`;

    return NextResponse.json({
      income: monthlyIncome * 100, // Convert booking count to estimated income
      expenses: monthlyExpenses._sum.price || 0,
      netCashFlow,
      period,
    });
  } catch (error) {
    console.error('Error fetching cash flow summary:', error);

    if (error instanceof APIError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
