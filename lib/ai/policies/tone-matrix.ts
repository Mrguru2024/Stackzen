import 'server-only';

import { prisma } from '@/lib/prisma';
import type { AITone } from '@/lib/ai/types';

const STYLE_MAP: Record<string, AITone> = {
  calm: 'calm',
  coach: 'coach',
  direct: 'direct',
  supportive: 'coach',
  concise: 'direct',
};

export function normalizeTone(raw: string | null | undefined): AITone {
  if (!raw) return 'coach';
  const key = raw.trim().toLowerCase();
  return STYLE_MAP[key] ?? 'coach';
}

export async function resolveUserTone(userId: string): Promise<AITone> {
  const [onboarding, settings] = await Promise.all([
    prisma.userOnboardingData.findUnique({
      where: { userId },
      select: { aiCommunicationStyle: true },
    }),
    prisma.userSettings.findUnique({
      where: { userId },
      select: { dashboardLayout: true },
    }),
  ]);

  const layout = settings?.dashboardLayout;
  if (layout && typeof layout === 'object' && !Array.isArray(layout)) {
    const tone = (layout as Record<string, unknown>).aiTone;
    if (typeof tone === 'string') {
      return normalizeTone(tone);
    }
  }

  return normalizeTone(onboarding?.aiCommunicationStyle);
}

export function getPreferredProviderForTone(tone: AITone): 'claude' | 'openai' {
  return tone === 'direct' ? 'openai' : 'claude';
}
