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

    // Get total expenses from services
    const totalExpenses = await prisma.service.aggregate({
      _sum: {
        price: true,
      },
      where: {
        userId: session.user.id,
      },
    });

    // Get expenses by category
    const expensesByCategory = await prisma.service.groupBy({
      by: ['category'],
      _sum: {
        price: true,
      },
      where: {
        userId: session.user.id,
      },
    });

    // Calculate trend (comparing with last month)
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const lastMonthExpenses = await prisma.service.aggregate({
      _sum: {
        price: true,
      },
      where: {
        userId: session.user.id,
        createdAt: {
          gte: lastMonth,
          lte: lastMonthEnd,
        },
      },
    });

    const currentTotal = totalExpenses._sum.price || 0;
    const lastMonthTotal = lastMonthExpenses._sum.price || 0;
    const trend =
      lastMonthTotal === 0 ? 0 : ((currentTotal - lastMonthTotal) / lastMonthTotal) * 100;

    return NextResponse.json({
      totalExpenses: currentTotal,
      trend: Math.round(trend),
      topCategories: expensesByCategory
        .map(cat => ({
          category: cat.category,
          amount: cat._sum.price || 0,
        }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 3), // Get top 3 categories
    });
  } catch (error) {
    console.error('Error fetching expense summary:', error);

    if (error instanceof APIError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
