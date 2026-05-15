import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';

const marketInsights = [
  {
    id: 'mi_1',
    title: 'Tech Earnings Momentum',
    description: 'Large-cap tech earnings continue to support short-term upside momentum.',
    impact: 'positive',
    confidence: 83,
    category: 'equities',
    timestamp: '2026-05-05T12:00:00.000Z',
  },
  {
    id: 'mi_2',
    title: 'Rate Volatility',
    description: 'Bond market implies higher near-term volatility around policy meetings.',
    impact: 'neutral',
    confidence: 74,
    category: 'macro',
    timestamp: '2026-05-04T12:00:00.000Z',
  },
  {
    id: 'mi_3',
    title: 'Energy Supply Risk',
    description: 'Supply pressure may affect energy-sensitive sectors for the next quarter.',
    impact: 'negative',
    confidence: 71,
    category: 'commodities',
    timestamp: '2026-05-03T12:00:00.000Z',
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

    return NextResponse.json(marketInsights);
  } catch (error) {
    console.error('[MARKET_INSIGHTS_GET]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
