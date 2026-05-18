export const MAX_AI_USER_MESSAGE_LENGTH = 8000;

const INJECTION_PATTERNS: RegExp[] = [
  /ignore\s+(all\s+)?(previous|prior)\s+instructions/i,
  /disregard\s+(the\s+)?(system|above)\s+(prompt|instructions)/i,
  /you\s+are\s+now\s+(a|an)\s+/i,
  /<\s*script\b/i,
  /\bact\s+as\s+(?:a|an)\s+(?:unrestricted|jailbroken)/i,
  /\bDAN\s+mode\b/i,
  /\bsystem\s*:\s*/i,
  /\bdeveloper\s+message\b/i,
];

const RESTRICTED_TOPIC_PATTERNS: RegExp[] = [
  /\b(specific|personalized)\s+(investment|tax|legal)\s+advice\b/i,
  /\bwhich\s+stock\s+should\s+i\s+buy\b/i,
  /\bwhat\s+should\s+i\s+invest\s+in\b/i,
  /\bshould\s+i\s+(?:buy|sell)\b/i,
  /\bguaranteed\s+returns?\b/i,
  /\ballocate\s+100%\b/i,
];

export type PromptGuardResult =
  | { allowed: true }
  | { allowed: false; code: string; message: string };

export function guardUserPrompt(message: string): PromptGuardResult {
  const trimmed = message.trim();
  if (!trimmed) {
    return { allowed: false, code: 'EMPTY_MESSAGE', message: 'Message cannot be empty' };
  }

  if (trimmed.length > MAX_AI_USER_MESSAGE_LENGTH) {
    return {
      allowed: false,
      code: 'MESSAGE_TOO_LONG',
      message: `Message must be at most ${MAX_AI_USER_MESSAGE_LENGTH} characters`,
    };
  }

  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(trimmed)) {
      return {
        allowed: false,
        code: 'PROMPT_INJECTION',
        message: 'Your message could not be processed. Please rephrase without system-style instructions.',
      };
    }
  }

  for (const pattern of RESTRICTED_TOPIC_PATTERNS) {
    if (pattern.test(trimmed)) {
      return {
        allowed: false,
        code: 'RESTRICTED_TOPIC',
        message:
          'StackZen AI provides general education only. For personalized investment, tax, or legal guidance, please speak with a licensed professional or book a human mentor.',
      };
    }
  }

  return { allowed: true };
}

export { MONEY_MENTOR_SYSTEM_PREAMBLE } from '@/lib/ai/prompts/compliance';
