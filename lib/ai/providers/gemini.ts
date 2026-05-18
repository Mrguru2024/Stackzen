import 'server-only';

import {
  getAiRequestTimeoutMs,
  getGeminiModel,
  isGeminiConfigured,
} from '@/lib/ai/config';
import {
  ProviderNotConfiguredError,
  ProviderRateLimitError,
  ProviderResponseError,
  ProviderTimeoutError,
} from '@/lib/ai/providers/errors';
import type { AIProvider, AIRequest, AIResponse } from '@/lib/ai/types';

function geminiApiKey(): string {
  return (
    process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim() ??
    process.env.GEMINI_API_KEY?.trim() ??
    ''
  );
}

export const geminiProvider: AIProvider = {
  id: 'gemini',

  isConfigured(): boolean {
    return isGeminiConfigured();
  },

  async generate(input: AIRequest): Promise<AIResponse> {
    if (!this.isConfigured()) {
      throw new ProviderNotConfiguredError('gemini');
    }

    const model = getGeminiModel();
    const started = Date.now();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), getAiRequestTimeoutMs());

    const system = input.messages.find(m => m.role === 'system')?.content ?? '';
    const conversation = input.messages.filter(m => m.role !== 'system');

    const contents = conversation.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(geminiApiKey())}`;

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: system ? { parts: [{ text: system }] } : undefined,
          contents,
          generationConfig: {
            maxOutputTokens: input.options?.maxTokens ?? 1024,
            temperature: input.options?.temperature ?? 0.7,
          },
        }),
        signal: controller.signal,
      });

      if (res.status === 429) {
        throw new ProviderRateLimitError('gemini', res.status);
      }
      if (!res.ok) {
        const errBody = await res.text().catch(() => '');
        throw new ProviderResponseError('gemini', res.status, errBody.slice(0, 200));
      }

      const data = (await res.json()) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
        usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number };
      };

      const text =
        data.candidates?.[0]?.content?.parts
          ?.map(p => p.text ?? '')
          .join('')
          .trim() ?? '';

      return {
        text,
        provider: 'gemini',
        model,
        policyApplied: false,
        blocked: false,
        latencyMs: Date.now() - started,
        fallbackUsed: false,
        usage: {
          inputTokens: data.usageMetadata?.promptTokenCount,
          outputTokens: data.usageMetadata?.candidatesTokenCount,
        },
      };
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') {
        throw new ProviderTimeoutError('gemini');
      }
      throw e;
    } finally {
      clearTimeout(timeout);
    }
  },
};
