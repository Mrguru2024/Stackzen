import 'server-only';

import {
  getAiMaxFallbackDepth,
  getProviderChainForTask,
  isAiFeaturesEnabled,
  isProviderConfigured,
} from '@/lib/ai/config';
import {
  buildEducationalFallbackResponse,
  generateEducationalResponse,
} from '@/lib/ai/educational-fallback';
import { logAiGeneration, logProviderFailure } from '@/lib/ai/logging/ai-logger';
import { moderateAssistantOutput } from '@/lib/ai/moderation/moderation';
import { analyzePhrase, resolveTaskFromIntent } from '@/lib/ai/policies/phrase-catcher';
import { getPreferredProviderForTone, resolveUserTone } from '@/lib/ai/policies/tone-matrix';
import { guardUserPrompt } from '@/lib/ai/prompt-guard';
import { assembleMessages } from '@/lib/ai/prompts/registry';
import { getProvider } from '@/lib/ai/providers/index';
import { ProviderNotConfiguredError } from '@/lib/ai/providers/errors';
import type { AIMessage, AIRequest, AIResponse, AITaskType } from '@/lib/ai/types';

export type OrchestrateParams = {
  userId: string;
  message: string;
  task?: AITaskType;
  sessionId?: string;
  context?: AIRequest['context'];
  options?: AIRequest['options'];
  skipAudit?: boolean;
};

export type OrchestrateResult =
  | { ok: true; response: AIResponse; userMessage: string }
  | { ok: false; blocked: true; code: string; response: string }
  | { ok: false; blocked: false; error: string; code: string };

function lastUserContent(messages: AIMessage[]): string {
  const users = messages.filter(m => m.role === 'user');
  return users[users.length - 1]?.content ?? '';
}

export async function orchestrateAi(params: OrchestrateParams): Promise<OrchestrateResult> {
  if (!isAiFeaturesEnabled()) {
    return {
      ok: false,
      blocked: false,
      error: 'AI features are disabled',
      code: 'AI_DISABLED',
    };
  }

  const phrase = analyzePhrase(params.message);

  if (phrase.crisisResponse) {
    const crisisResponse: AIResponse = {
      text: phrase.crisisResponse,
      provider: 'educational',
      model: 'crisis-static-v1',
      policyApplied: false,
      blocked: false,
      latencyMs: 0,
      fallbackUsed: false,
      metadata: { intent: phrase.intent },
    };
    if (!params.skipAudit) {
      await logAiGeneration({
        userId: params.userId,
        task: 'emotional_support',
        response: crisisResponse,
        intent: phrase.intent,
      });
    }
    return { ok: true, response: crisisResponse, userMessage: params.message };
  }

  if (phrase.block) {
    if (!params.skipAudit) {
      await logAiGeneration({
        userId: params.userId,
        task: params.task ?? 'financial_guidance',
        response: {
          text: phrase.block.message,
          provider: 'educational',
          model: 'policy-block',
          policyApplied: false,
          blocked: true,
          blockCode: phrase.block.code,
          latencyMs: 0,
          fallbackUsed: false,
        },
        intent: phrase.intent,
        promptBlocked: true,
      });
    }
    return {
      ok: false,
      blocked: true,
      code: phrase.block.code,
      response: phrase.block.message,
    };
  }

  const guard = guardUserPrompt(params.message);
  if (!guard.allowed) {
    if (!params.skipAudit) {
      await logAiGeneration({
        userId: params.userId,
        task: params.task ?? 'financial_guidance',
        response: {
          text: guard.message,
          provider: 'educational',
          model: 'prompt-guard',
          policyApplied: false,
          blocked: true,
          blockCode: guard.code,
          latencyMs: 0,
          fallbackUsed: false,
        },
        intent: phrase.intent,
        promptBlocked: true,
      });
    }
    return { ok: false, blocked: true, code: guard.code, response: guard.message };
  }

  const tone = await resolveUserTone(params.userId);
  const task = resolveTaskFromIntent(phrase, params.task ?? 'financial_guidance');
  const tonePreferred = getPreferredProviderForTone(tone);

  const userMessages: AIMessage[] = [{ role: 'user', content: params.message }];
  const messages = assembleMessages(task, userMessages, tone);

  const input: AIRequest = {
    task,
    messages,
    userId: params.userId,
    sessionId: params.sessionId,
    tone,
    intent: phrase.intent,
    context: params.context,
    options: {
      ...params.options,
      preferredProvider: params.options?.preferredProvider ?? tonePreferred,
    },
  };

  const chain = getProviderChainForTask(task, input.options?.preferredProvider).filter(
    isProviderConfigured
  );

  const maxAttempts = Math.min(chain.length, getAiMaxFallbackDepth() + 1);
  let lastError = 'No AI providers configured';

  for (let i = 0; i < maxAttempts; i++) {
    const providerId = chain[i];
    if (!providerId) break;

    try {
      const provider = getProvider(providerId);
      const raw = await provider.generate(input);
      const moderated = moderateAssistantOutput(raw.text || generateEducationalResponse(params.message, {
        incomeProfileTags: params.context?.incomeProfileTags,
      }), {
        ...raw,
        fallbackUsed: i > 0,
      });

      if (!params.skipAudit) {
        await logAiGeneration({
          userId: params.userId,
          task,
          response: moderated,
          intent: phrase.intent,
          tone,
        });
      }

      return { ok: true, response: moderated, userMessage: params.message };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      lastError = msg;
      if (!(e instanceof ProviderNotConfiguredError)) {
        await logProviderFailure({
          userId: params.userId,
          provider: providerId,
          task,
          error: msg,
        });
      }
    }
  }

  const started = Date.now();
  const fallbackText = generateEducationalResponse(params.message, {
    incomeProfileTags: params.context?.incomeProfileTags,
    investmentExperience: params.context?.financialSnapshot?.investmentExperience as
      | 'beginner'
      | 'intermediate'
      | 'advanced'
      | undefined,
    riskTolerance: params.context?.financialSnapshot?.riskTolerance as
      | 'low'
      | 'medium'
      | 'high'
      | undefined,
  });

  const fallback = moderateAssistantOutput(
    fallbackText,
    buildEducationalFallbackResponse(input, fallbackText, Date.now() - started, chain.length > 0)
  );

  if (!params.skipAudit) {
    await logAiGeneration({
      userId: params.userId,
      task,
      response: fallback,
      intent: phrase.intent,
      tone,
    });
  }

  if (!fallback.text) {
    return {
      ok: false,
      blocked: false,
      error: lastError,
      code: 'AI_PROVIDER_UNAVAILABLE',
    };
  }

  return { ok: true, response: fallback, userMessage: params.message };
}

/** @deprecated Use orchestrateAi — kept for typed message extraction in tests */
export function extractUserMessage(messages: AIMessage[]): string {
  return lastUserContent(messages);
}
