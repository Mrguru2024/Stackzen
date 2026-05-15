import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuthSession } from '@/lib/api/require-auth';
import { enforceApiRateLimit } from '@/lib/api/rate-limit-request';
import { prisma } from '@/lib/prisma';
import { resolveIncomeProfileActivation } from '@/lib/income-profiles/activation';

interface UserContext {
  financialGoals?: string[];
  riskTolerance?: 'low' | 'medium' | 'high';
  investmentExperience?: 'beginner' | 'intermediate' | 'advanced';
  currentPortfolio?: {
    stocks: number;
    bonds: number;
    cash: number;
    other: number;
  };
  previousInteractions?: {
    topic: string;
    timestamp: Date;
  }[];
}

const RESTRICTED_TOPICS = [
  'specific investment advice',
  'tax advice',
  'legal advice',
  'insurance recommendations',
  'specific stock picks',
  'specific fund recommendations',
  'specific financial products',
  'specific financial institutions',
];

const postSchema = z
  .object({
    message: z.string().min(1).max(8000),
    context: z.record(z.string(), z.unknown()).optional(),
  })
  .strict();

function containsRestrictedTopics(message: string): boolean {
  const lowerMessage = message.toLowerCase();
  return RESTRICTED_TOPICS.some(topic => lowerMessage.includes(topic));
}

function generatePersonalizedSuggestions(message: string, context: UserContext): string {
  const lowerMessage = message.toLowerCase();
  let response = '';

  const experience = context.investmentExperience || 'beginner';
  const riskTolerance = context.riskTolerance || 'medium';

  if (lowerMessage.includes('investment') || lowerMessage.includes('invest')) {
    response = `Based on your ${experience} level and ${riskTolerance} risk tolerance, you might want to consider exploring these general concepts:\n\n`;
    response += '1. Diversification principles\n';
    response += '2. Understanding different asset classes\n';
    response += '3. Long-term vs short-term investment strategies\n\n';
    response +=
      'For specific investment advice tailored to your situation, I recommend scheduling a session with one of our human financial mentors.';
  } else if (lowerMessage.includes('budget') || lowerMessage.includes('saving')) {
    response = 'Here are some general suggestions for budgeting and saving:\n\n';
    response += '1. Track your expenses to understand your spending patterns\n';
    response += '2. Set up automatic savings transfers\n';
    response += '3. Consider the 50/30/20 rule as a starting point\n\n';
    response += 'Would you like to learn more about any of these concepts?';
  } else if (lowerMessage.includes('debt') || lowerMessage.includes('loan')) {
    response = 'Here are some general approaches to debt management:\n\n';
    response += '1. Prioritize high-interest debt\n';
    response += '2. Consider debt consolidation options\n';
    response += '3. Create a debt repayment plan\n\n';
    response +=
      'For a detailed debt management strategy, our human mentors can provide personalized guidance.';
  } else {
    response =
      'I can help you understand general financial concepts and provide educational resources. What specific area would you like to learn more about?';
  }

  return response;
}

async function getAIResponse(
  message: string,
  context: UserContext
): Promise<{ response: string; updatedContext: UserContext }> {
  await new Promise(resolve => setTimeout(resolve, 300));

  if (containsRestrictedTopics(message)) {
    return {
      response:
        "I understand you're looking for specific financial guidance. For detailed financial advice and specific recommendations, I recommend scheduling a session with one of our human financial mentors. They can provide personalized guidance based on your unique situation.",
      updatedContext: context,
    };
  }

  const response = generatePersonalizedSuggestions(message, context);

  const updatedContext: UserContext = {
    ...context,
    previousInteractions: [
      ...(context.previousInteractions || []),
      {
        topic: message,
        timestamp: new Date(),
      },
    ],
  };

  return { response, updatedContext };
}

export async function POST(request: Request) {
  const limited = await enforceApiRateLimit(request, 'ai_money_mentor');
  if (limited) return limited;

  const { session, response: authRes } = await requireAuthSession();
  if (authRes) return authRes;

  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const parsed = postSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const profileRows = await prisma.userIncomeProfile.findMany({
      where: { userId: session.user.id, isActive: true },
      select: { type: true },
    });
    const activation = resolveIncomeProfileActivation(profileRows.map(profile => profile.type));

    const { message, context } = parsed.data;
    const ctx = {
      ...(context ?? {}),
      incomeProfileTags: activation.aiContextTags,
    } as UserContext;

    const { response, updatedContext } = await getAIResponse(message, ctx);

    return NextResponse.json({
      response,
      updatedContext,
    });
  } catch {
    console.error('[money-mentor] POST failed');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  const { session, response: authRes } = await requireAuthSession();
  if (authRes) return authRes;

  try {
    const profileRows = await prisma.userIncomeProfile.findMany({
      where: { userId: session.user.id, isActive: true },
      select: { type: true },
    });
    const activation = resolveIncomeProfileActivation(profileRows.map(profile => profile.type));

    return NextResponse.json({
      messages: [],
      context: {
        incomeProfileTags: activation.aiContextTags,
      },
    });
  } catch {
    console.error('[money-mentor] GET failed');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
