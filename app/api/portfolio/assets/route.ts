import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';

const portfolioAssets = [
  {
    id: 'pa_1',
    name: 'S&P 500 ETF',
    type: 'ETF',
    amount: 12.4,
    value: 6840,
    return: 12.8,
    allocation: 38,
    riskLevel: 'low',
    lastUpdated: '2026-05-07T00:00:00.000Z',
  },
  {
    id: 'pa_2',
    name: 'Tech Growth Fund',
    type: 'Mutual Fund',
    amount: 48.1,
    value: 5120,
    return: 18.2,
    allocation: 29,
    riskLevel: 'medium',
    lastUpdated: '2026-05-07T00:00:00.000Z',
  },
  {
    id: 'pa_3',
    name: 'US Treasury Ladder',
    type: 'Bonds',
    amount: 1,
    value: 3060,
    return: 4.1,
    allocation: 17,
    riskLevel: 'low',
    lastUpdated: '2026-05-07T00:00:00.000Z',
  },
  {
    id: 'pa_4',
    name: 'Crypto Index',
    type: 'Digital Assets',
    amount: 0.72,
    value: 2920,
    return: -6.5,
    allocation: 16,
    riskLevel: 'high',
    lastUpdated: '2026-05-07T00:00:00.000Z',
  },
];

export async function GET() {
  try {
    if (process.env.NODE_ENV !== 'development') {
      const session = await getServerSession(authOptions);
      if (!session?.user) {
        return new NextResponse('Unauthorized', { status: 401 });
      }
    }

    return NextResponse.json(portfolioAssets);
  } catch (error) {
    console.error('[PORTFOLIO_ASSETS_GET]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
