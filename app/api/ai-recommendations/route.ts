import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';

const aiRecommendations = [
  {
    id: 'air_1',
    title: 'Increase Broad ETF Allocation',
    description: 'Increase broad-market ETF allocation by 5% to reduce concentration risk.',
    confidence: 86,
    riskLevel: 'low',
    potentialReturn: 8.4,
    timeframe: '3-6 months',
    category: 'portfolio-balance',
  },
  {
    id: 'air_2',
    title: 'Rotate Portion to Defensive Sectors',
    description: 'Shift a portion of cyclical holdings into defensive sectors.',
    confidence: 79,
    riskLevel: 'medium',
    potentialReturn: 6.1,
    timeframe: '1-3 months',
    category: 'risk-management',
  },
  {
    id: 'air_3',
    title: 'Keep Cash Buffer for Pullbacks',
    description: 'Maintain a 10% cash reserve to capture pullback entries.',
    confidence: 74,
    riskLevel: 'low',
    potentialReturn: 5.3,
    timeframe: 'ongoing',
    category: 'liquidity',
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

    return NextResponse.json(aiRecommendations);
  } catch (error) {
    console.error('[AI_RECOMMENDATIONS_GET]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
