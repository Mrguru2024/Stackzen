import { NextResponse } from 'next/server';
import { requireAuthSession } from '@/lib/api/require-auth';
import { requireAiConsent } from '@/lib/ai/consent';
import { applyResponsePolicy, softenDirectivePhrases } from '@/lib/ai/response-policy';
import { logAiInteraction } from '@/lib/ai/memory';
import { logSafeError } from '@/lib/security/safe-log';

const aiRecommendations = [
  {
    id: 'air_1',
    title: 'Review broad ETF allocation',
    description:
      'One option to consider is whether a broad-market ETF allocation fits your goals — compare with a licensed professional.',
    confidence: 86,
    riskLevel: 'low',
    potentialReturn: 8.4,
    timeframe: '3-6 months',
    category: 'portfolio-balance',
  },
  {
    id: 'air_2',
    title: 'Explore defensive sector balance',
    description:
      'You may want to compare cyclical vs defensive sector exposure as part of a diversified plan.',
    confidence: 79,
    riskLevel: 'medium',
    potentialReturn: 6.1,
    timeframe: '1-3 months',
    category: 'risk-management',
  },
  {
    id: 'air_3',
    title: 'Maintain a liquidity buffer',
    description:
      'Some people keep a cash reserve for flexibility — the right amount depends on your situation.',
    confidence: 74,
    riskLevel: 'low',
    potentialReturn: 5.3,
    timeframe: 'ongoing',
    category: 'liquidity',
  },
];

export async function GET() {
  try {
    const { session, response } = await requireAuthSession();
    if (response) return response;

    const consentBlock = await requireAiConsent(session.user.id);
    if (consentBlock) return consentBlock;

    const sanitized = aiRecommendations.map(item => {
      const policy = applyResponsePolicy(softenDirectivePhrases(item.description));
      return {
        ...item,
        description: policy.text,
        disclaimer: 'Educational only — not personalized investment advice.',
      };
    });

    await logAiInteraction({
      userId: session.user.id,
      action: 'ai.recommendations_viewed',
      details: { count: sanitized.length },
    });

    return NextResponse.json(sanitized);
  } catch (error) {
    logSafeError('AI_RECOMMENDATIONS_GET', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
