import 'server-only';

import { claudeProvider } from '@/lib/ai/providers/claude';
import { geminiProvider } from '@/lib/ai/providers/gemini';
import { openAiProvider } from '@/lib/ai/providers/openai';
import type { AIProvider } from '@/lib/ai/types';
import type { AIProviderId } from '@/lib/ai/types';

const PROVIDERS: Record<Exclude<AIProviderId, 'educational'>, AIProvider> = {
  openai: openAiProvider,
  claude: claudeProvider,
  gemini: geminiProvider,
};

export function getProvider(id: Exclude<AIProviderId, 'educational'>): AIProvider {
  return PROVIDERS[id];
}

export function listConfiguredProviders(): Exclude<AIProviderId, 'educational'>[] {
  return (Object.keys(PROVIDERS) as Array<Exclude<AIProviderId, 'educational'>>).filter(id =>
    PROVIDERS[id].isConfigured()
  );
}
