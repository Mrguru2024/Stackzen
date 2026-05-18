import type { AuthedSession } from '@/lib/api/require-auth';
import { resolveIncomeProfileActivation } from '@/lib/income-profiles/activation';
import { saveChatMessage } from '@/lib/ai/chat-persistence';
import { getAiPrivacySettings } from '@/lib/ai/consent';
import { canPersistAiMemory, listAiMemory } from '@/lib/ai/memory';
import { orchestrateAi } from '@/lib/ai/router';
import { prisma } from '@/lib/prisma';

export interface UserContext {
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
  incomeProfileTags?: string[];
}

async function buildUserContext(userId: string, context?: Record<string, unknown>): Promise<UserContext> {
  const profileRows = await prisma.userIncomeProfile.findMany({
    where: { userId, isActive: true },
    select: { type: true },
  });
  const activation = resolveIncomeProfileActivation(profileRows.map(p => p.type));

  return {
    ...(context ?? {}),
    incomeProfileTags: activation.aiContextTags,
  } as UserContext;
}

export async function handleMoneyMentorChat(
  session: AuthedSession,
  message: string,
  context?: Record<string, unknown>
) {
  const userCtx = await buildUserContext(session.user.id, context);

  const result = await orchestrateAi({
    userId: session.user.id,
    message,
    task: 'financial_guidance',
    context: {
      incomeProfileTags: userCtx.incomeProfileTags,
      financialSnapshot: {
        riskTolerance: userCtx.riskTolerance,
        investmentExperience: userCtx.investmentExperience,
      },
    },
  });

  if (!result.ok && result.blocked) {
    return {
      blocked: true as const,
      code: result.code,
      response: result.response,
    };
  }

  if (!result.ok) {
    return {
      blocked: true as const,
      code: result.code,
      response: result.error,
    };
  }

  const response = result.response.text;
  const privacy = await getAiPrivacySettings(session.user.id);
  const persistMemory = await canPersistAiMemory(session.user.id);

  if (persistMemory) {
    await saveChatMessage(session.user.id, message, {
      role: 'user',
      provider: result.response.provider,
      model: result.response.model,
    });
    await saveChatMessage(session.user.id, response, {
      role: 'assistant',
      provider: result.response.provider,
      model: result.response.model,
    });
  }

  const updatedContext: UserContext = {
    ...userCtx,
    previousInteractions: [
      ...(userCtx.previousInteractions || []),
      { topic: message.slice(0, 200), timestamp: new Date() },
    ],
  };

  return {
    blocked: false as const,
    response,
    updatedContext,
    policyApplied: result.response.policyApplied,
    provider: result.response.provider,
    model: result.response.model,
    fallbackUsed: result.response.fallbackUsed,
    aiMemoryEnabled: privacy.aiMemoryEnabled,
  };
}

export async function getMoneyMentorHistory(userId: string) {
  const userCtx = await buildUserContext(userId);
  const privacy = await getAiPrivacySettings(userId);
  const rows = privacy.aiMemoryEnabled ? await listAiMemory(userId, 20) : [];

  const messages = [...rows].reverse().map((m, index) => {
    let role = m.role;
    if (!role) {
      role = index % 2 === 0 ? 'user' : 'assistant';
    }
    return {
      id: m.id,
      content: m.content,
      role: role as 'user' | 'assistant',
      timestamp: m.createdAt ?? new Date(),
      provider: m.provider ?? undefined,
      model: m.model ?? undefined,
    };
  });

  return {
    messages,
    context: { incomeProfileTags: userCtx.incomeProfileTags },
    privacy,
  };
}
