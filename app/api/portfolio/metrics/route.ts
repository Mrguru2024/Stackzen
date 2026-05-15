import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';

const portfolioMetrics = {
  totalValue: 17940,
  totalReturn: 9.7,
  monthlyReturn: 1.9,
  yearlyReturn: 11.4,
  riskScore: 58,
  diversificationScore: 81,
};

export async function GET() {
  try {
    if (process.env.NODE_ENV !== 'development') {
      const session = await getServerSession(authOptions);
      if (!session?.user) {
        return new NextResponse('Unauthorized', { status: 401 });
      }
    }

    return NextResponse.json(portfolioMetrics);
  } catch (error) {
    console.error('[PORTFOLIO_METRICS_GET]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
