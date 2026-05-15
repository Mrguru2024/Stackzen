import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { cache, cacheKeys, CACHE_TTL } from '@/lib/redis';
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

    // Generate cache key for current month
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const cacheKey = cacheKeys.incomeSummary(session.user.id, monthKey);

    // Try to get from cache first, fallback to database
    const cachedData = await cache.get(cacheKey);
    if (cachedData) {
      return NextResponse.json(cachedData);
    }

    // Get current month's start and end dates
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const [completedBookings, totalBookings, ledgerRows, bankIncomeRows] = await Promise.all([
      prisma.booking.findMany({
        where: {
          userId: session.user.id,
          status: 'completed',
          date: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
        select: {
          service: {
            select: {
              price: true,
              category: true,
            },
          },
        },
        orderBy: {
          date: 'desc',
        },
      }),
      prisma.booking.count({
        where: {
          userId: session.user.id,
          status: 'completed',
          date: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
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
        select: { amount: true, source: true },
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
        select: { amount: true },
      }),
    ]);

    const bookingTotal = completedBookings.reduce(
      (sum, booking) => sum + (booking.service?.price || 0),
      0
    );
    const ledgerTotal = ledgerRows.reduce((sum, row) => sum + row.amount, 0);
    const bankDepositTotal = bankIncomeRows.reduce((sum, row) => sum + row.amount, 0);
    const totalIncome = bookingTotal + ledgerTotal + bankDepositTotal;

    const incomeByCategory = completedBookings.reduce(
      (acc, booking) => {
        const category = booking.service?.category || 'Uncategorized';
        const amount = booking.service?.price || 0;
        acc[category] = (acc[category] || 0) + amount;
        return acc;
      },
      {} as Record<string, number>
    );

    for (const row of ledgerRows) {
      const label = row.source?.trim() ? `Manual: ${row.source}` : 'Manual income';
      incomeByCategory[label] = (incomeByCategory[label] || 0) + row.amount;
    }

    if (bankDepositTotal > 0) {
      incomeByCategory['Bank deposits (synced)'] =
        (incomeByCategory['Bank deposits (synced)'] || 0) + bankDepositTotal;
    }

    // Convert to array format
    const incomeByCategoryArray = Object.entries(incomeByCategory).map(([category, amount]) => ({
      category,
      amount,
    }));

    const incomeEventCount = totalBookings + ledgerRows.length + bankIncomeRows.length;
    const averageIncome = incomeEventCount > 0 ? totalIncome / incomeEventCount : 0;

    const incomeSummary = {
      totalIncome,
      averageIncome,
      incomeByCategory: incomeByCategoryArray,
      totalBookings,
      breakdown: {
        servicesBookings: bookingTotal,
        manualLedger: ledgerTotal,
        bankDepositsSynced: bankDepositTotal,
      },
    };

    // Cache the result for 15 minutes (income data doesn't change frequently)
    await cache.set(cacheKey, incomeSummary, CACHE_TTL.SHORT);

    return NextResponse.json(incomeSummary);
  } catch (error) {
    console.error('Error fetching income summary:', error);

    if (error instanceof APIError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
