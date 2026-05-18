import 'server-only';

import {
  getAiRequestTimeoutMs,
  getClaudeModel,
  isClaudeConfigured,
} from '@/lib/ai/config';
import {
  ProviderNotConfiguredError,
  ProviderRateLimitError,
  ProviderResponseError,
  ProviderTimeoutError,
} from '@/lib/ai/providers/errors';
import type { AIProvider, AIRequest, AIResponse } from '@/lib/ai/types';

export const claudeProvider: AIProvider = {
  id: 'claude',

  isConfigured(): boolean {
    return isClaudeConfigured();
  },

  async generate(input: AIRequest): Promise<AIResponse> {
    if (!this.isConfigured()) {
      throw new ProviderNotConfiguredError('claude');
    }

    const model = getClaudeModel();
    const started = Date.now();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), getAiRequestTimeoutMs());

    const system = input.messages.find(m => m.role === 'system')?.content ?? '';
    const messages = input.messages
      .filter(m => m.role !== 'system')
      .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }));

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': process.env.ANTHROPIC_API_KEY!,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          max_tokens: input.options?.maxTokens ?? 1024,
          temperature: input.options?.temperature ?? 0.7,
          system: system || undefined,
          messages,
        }),
        signal: controller.signal,
      });

      if (res.status === 429) {
        throw new ProviderRateLimitError('claude', res.status);
      }
      if (!res.ok) {
        const errBody = await res.text().catch(() => '');
        throw new ProviderResponseError('claude', res.status, errBody.slice(0, 200));
      }

      const data = (await res.json()) as {
        content?: Array<{ type: string; text?: string }>;
        usage?: { input_tokens?: number; output_tokens?: number };
      };

      const text =
        data.content
          ?.filter(block => block.type === 'text')
          .map(block => block.text ?? '')
          .join('')
          .trim() ?? '';

      return {
        text,
        provider: 'claude',
        model,
        policyApplied: false,
        blocked: false,
        latencyMs: Date.now() - started,
        fallbackUsed: false,
        usage: {
          inputTokens: data.usage?.input_tokens,
          outputTokens: data.usage?.output_tokens,
        },
      };
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') {
        throw new ProviderTimeoutError('claude');
      }
      throw e;
    } finally {
      clearTimeout(timeout);
    }
  },
};
