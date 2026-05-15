import { NextResponse } from 'next/server';
import { requireAuthSession } from '@/lib/api/require-auth';

export async function GET() {
  const { response } = await requireAuthSession();
  if (response) return response;

  try {
    // Placeholder aggregates — wire to Prisma CreditCard/DebitCard when product-ready
    const stats = {
      totalCreditCards: 0,
      totalDebitCards: 0,
      totalCreditLimit: 0,
      totalAvailableCredit: 0,
      totalCurrentBalance: 0,
      totalRewardsEarned: 0,
      recentTransactions: 0,
    };

    return NextResponse.json(stats);
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
