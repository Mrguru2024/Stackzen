import 'server-only';

import {
  getAiRequestTimeoutMs,
  getOpenAiModel,
  isOpenAiConfigured,
} from '@/lib/ai/config';
import {
  ProviderNotConfiguredError,
  ProviderRateLimitError,
  ProviderResponseError,
  ProviderTimeoutError,
} from '@/lib/ai/providers/errors';
import type { AIProvider } from '@/lib/ai/types';
import type { AIRequest, AIResponse } from '@/lib/ai/types';

export const openAiProvider: AIProvider = {
  id: 'openai',

  isConfigured(): boolean {
    return isOpenAiConfigured();
  },

  async generate(input: AIRequest): Promise<AIResponse> {
    if (!this.isConfigured()) {
      throw new ProviderNotConfiguredError('openai');
    }

    const model = getOpenAiModel();
    const started = Date.now();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), getAiRequestTimeoutMs());

    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: input.messages,
          max_tokens: input.options?.maxTokens ?? 1024,
          temperature: input.options?.temperature ?? 0.7,
        }),
        signal: controller.signal,
      });

      if (res.status === 429) {
        throw new ProviderRateLimitError('openai', res.status);
      }
      if (!res.ok) {
        const errBody = await res.text().catch(() => '');
        throw new ProviderResponseError('openai', res.status, errBody.slice(0, 200));
      }

      const data = (await res.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
        usage?: { prompt_tokens?: number; completion_tokens?: number };
      };

      const text = data.choices?.[0]?.message?.content?.trim() ?? '';

      return {
        text,
        provider: 'openai',
        model,
        policyApplied: false,
        blocked: false,
        latencyMs: Date.now() - started,
        fallbackUsed: false,
        usage: {
          inputTokens: data.usage?.prompt_tokens,
          outputTokens: data.usage?.completion_tokens,
        },
      };
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') {
        throw new ProviderTimeoutError('openai');
      }
      throw e;
    } finally {
      clearTimeout(timeout);
    }
  },
};
