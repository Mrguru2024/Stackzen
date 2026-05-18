import type { AITaskType, PhraseCatcherResult } from '@/lib/ai/types';

const CRISIS_PATTERNS: RegExp[] = [
  /\b(kill|hurt)\s+myself\b/i,
  /\bend\s+my\s+life\b/i,
  /\bsuicid/i,
  /\bself[- ]?harm\b/i,
];

const AFFORDABILITY_PATTERNS: RegExp[] = [
  /\bcan\s+i\s+afford\b/i,
  /\bshould\s+i\s+buy\b/i,
  /\bshould\s+i\s+sell\b/i,
  /\bwhat\s+should\s+i\s+invest\s+in\b/i,
];

const HELP_PATTERNS: RegExp[] = [
  /\bi\s+need\s+help\b/i,
  /\bi'?m\s+struggling\b/i,
  /\bfeeling\s+overwhelmed\b/i,
];

const INVESTING_EDUCATION_PATTERNS: RegExp[] = [
  /\bhow\s+(?:does|do)\s+investing\b/i,
  /\binvesting\s+basics\b/i,
  /\bwhat\s+is\s+diversification\b/i,
];

const CRISIS_RESPONSE = `I'm really glad you reached out. StackZen AI can't provide crisis support.

If you're in the United States and need immediate help, please call or text **988** (Suicide & Crisis Lifeline) or contact emergency services.

You can also speak with a licensed professional or book a human mentor in StackZen when you're ready.`;

export function analyzePhrase(message: string): PhraseCatcherResult {
  const trimmed = message.trim();
  if (!trimmed) {
    return { intent: 'empty', confidence: 1, block: { code: 'EMPTY_MESSAGE', message: 'Message cannot be empty' } };
  }

  for (const pattern of CRISIS_PATTERNS) {
    if (pattern.test(trimmed)) {
      return {
        intent: 'crisis_distress',
        confidence: 0.95,
        crisisResponse: CRISIS_RESPONSE,
      };
    }
  }

  for (const pattern of AFFORDABILITY_PATTERNS) {
    if (pattern.test(trimmed)) {
      return {
        intent: 'affordability',
        confidence: 0.85,
        suggestedTask: 'financial_guidance',
        block: {
          code: 'AFFORDABILITY_REFRAME',
          message:
            'StackZen AI shares general education only — not personalized affordability or buy/sell guidance. Try asking about budgeting frameworks, emergency funds, or cash-flow planning instead.',
        },
      };
    }
  }

  for (const pattern of HELP_PATTERNS) {
    if (pattern.test(trimmed)) {
      return { intent: 'help_general', confidence: 0.8, suggestedTask: 'emotional_support' };
    }
  }

  for (const pattern of INVESTING_EDUCATION_PATTERNS) {
    if (pattern.test(trimmed)) {
      return { intent: 'investing_education', confidence: 0.75, suggestedTask: 'financial_guidance' };
    }
  }

  return { intent: 'general', confidence: 0.5, suggestedTask: 'financial_guidance' };
}

export function resolveTaskFromIntent(
  phrase: PhraseCatcherResult,
  defaultTask: AITaskType
): AITaskType {
  return phrase.suggestedTask ?? defaultTask;
}
