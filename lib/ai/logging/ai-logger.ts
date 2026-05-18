import 'server-only';

import { logAiInteraction } from '@/lib/ai/memory';
import type { AIResponse, AITaskType } from '@/lib/ai/types';

export async function logAiGeneration(params: {
  userId: string;
  task: AITaskType;
  response: AIResponse;
  intent?: string;
  tone?: string;
  promptBlocked?: boolean;
}): Promise<void> {
  await logAiInteraction({
    userId: params.userId,
    action: params.promptBlocked ? 'ai.prompt_blocked' : 'ai.chat_completed',
    severity: params.promptBlocked ? 'warning' : 'info',
    details: {
      task: params.task,
      provider: params.response.provider,
      model: params.response.model,
      latencyMs: params.response.latencyMs,
      fallbackUsed: params.response.fallbackUsed,
      policyApplied: params.response.policyApplied,
      intent: params.intent,
      tone: params.tone,
      blocked: params.response.blocked,
      blockCode: params.response.blockCode,
      usage: params.response.usage,
    },
  });

  if (params.response.policyApplied) {
    await logAiInteraction({
      userId: params.userId,
      action: 'ai.response_policy_applied',
      severity: 'warning',
      details: { provider: params.response.provider },
    });
  }
}

export async function logProviderFailure(params: {
  userId: string;
  provider: string;
  task: AITaskType;
  error: string;
}): Promise<void> {
  await logAiInteraction({
    userId: params.userId,
    action: 'ai.provider_failed',
    severity: 'warning',
    details: { provider: params.provider, task: params.task, error: params.error },
  });
}
