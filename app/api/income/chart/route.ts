import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { Session } from 'next-auth';
import { FinancialTransactionDirection, FinancialTransactionSource, TransactionCategoryKind } from '@prisma/client';

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

    const [completedBookings, ledgerRows, bankRows] = await Promise.all([
      prisma.booking.findMany({
        where: {
          userId: session.user.id,
          status: 'completed',
          date: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
        include: {
          service: true,
        },
      }),
      prisma.income.findMany({
        where: {
          userId: session.user.id,
          date: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
        select: { amount: true, date: true },
      }),
      prisma.financialTransaction.findMany({
        where: {
          userId: session.user.id,
          postedAt: { gte: startOfMonth, lte: endOfMonth },
          direction: FinancialTransactionDirection.INFLOW,
          source: FinancialTransactionSource.PLAID_SYNC,
          isTransfer: false,
          category: { kind: TransactionCategoryKind.INCOME },
        },
        select: { amount: true, postedAt: true },
      }),
    ]);

    const dailyIncome = completedBookings.reduce(
      (acc, booking) => {
        const date = booking.date.toISOString().split('T')[0];
        const amount = booking.service?.price || 0;
        acc[date] = (acc[date] || 0) + amount;
        return acc;
      },
      {} as Record<string, number>
    );

    for (const row of ledgerRows) {
      const date = row.date.toISOString().split('T')[0];
      dailyIncome[date] = (dailyIncome[date] || 0) + row.amount;
    }

    for (const row of bankRows) {
      const date = row.postedAt.toISOString().split('T')[0];
      dailyIncome[date] = (dailyIncome[date] || 0) + row.amount;
    }

    // Convert to array format and sort by date
    const chartData = Object.entries(dailyIncome)
      .map(([date, amount]) => ({
        date,
        amount,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json(chartData);
  } catch (error) {
    console.error('Error fetching income chart:', error);

    if (error instanceof APIError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
