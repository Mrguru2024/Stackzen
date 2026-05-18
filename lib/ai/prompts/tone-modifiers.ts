import type { AITone } from '@/lib/ai/types';

const TONE_MODIFIERS: Record<AITone, string> = {
  calm:
    'Tone: calm and reassuring. Use short sentences. Validate feelings without creating urgency. Avoid pressure.',
  coach:
    'Tone: supportive coach. Ask reflective questions. Encourage small steps. Stay educational, not directive.',
  direct:
    'Tone: clear and concise. Use bullet points when helpful. Stay factual and still non-directive — no orders or guarantees.',
};

export function getToneModifier(tone: AITone): string {
  return TONE_MODIFIERS[tone];
}
