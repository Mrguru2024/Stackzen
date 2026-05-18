import 'server-only';

import type { AIProviderId, AITaskType } from '@/lib/ai/types';

export function isAiFeaturesEnabled(): boolean {
  return process.env.ENABLE_AI_FEATURES !== 'false';
}

export function getAiRequestTimeoutMs(): number {
  const raw = Number(process.env.AI_REQUEST_TIMEOUT_MS ?? 30_000);
  return Number.isFinite(raw) && raw > 0 ? raw : 30_000;
}

export function getAiMaxFallbackDepth(): number {
  const raw = Number(process.env.AI_MAX_FALLBACK_DEPTH ?? 2);
  return Number.isFinite(raw) && raw >= 0 ? Math.min(raw, 3) : 2;
}

export function isOpenAiConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

export function isClaudeConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY?.trim());
}

export function isGeminiConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim() ?? process.env.GEMINI_API_KEY?.trim()
  );
}

export function getOpenAiModel(): string {
  return process.env.OPENAI_MODEL?.trim() || 'gpt-4o';
}

export function getClaudeModel(): string {
  return process.env.ANTHROPIC_MODEL?.trim() || 'claude-sonnet-4-20250514';
}

export function getGeminiModel(): string {
  return process.env.GEMINI_MODEL?.trim() || 'gemini-2.0-flash';
}

const TASK_ROUTING: Record<AITaskType, AIProviderId[]> = {
  orchestration: ['openai', 'gemini', 'claude'],
  structured_output: ['openai', 'gemini'],
  financial_guidance: ['claude', 'openai', 'gemini'],
  emotional_support: ['claude', 'openai'],
  document_analysis: ['gemini', 'openai', 'claude'],
  summarization: ['openai', 'gemini', 'claude'],
};

export function getProviderChainForTask(
  task: AITaskType,
  preferred?: AIProviderId
): Exclude<AIProviderId, 'educational'>[] {
  const base = TASK_ROUTING[task].filter((p): p is Exclude<AIProviderId, 'educational'> => p !== 'educational');
  if (!preferred || preferred === 'educational') {
    return base;
  }
  const rest = base.filter(p => p !== preferred);
  return [preferred, ...rest];
}

export function isProviderConfigured(id: Exclude<AIProviderId, 'educational'>): boolean {
  switch (id) {
    case 'openai':
      return isOpenAiConfigured();
    case 'claude':
      return isClaudeConfigured();
    case 'gemini':
      return isGeminiConfigured();
    default:
      return false;
  }
}
