import { z } from 'zod';

export const moneyMentorPostSchema = z
  .object({
    message: z.string().min(1).max(8000),
    context: z.record(z.string(), z.unknown()).optional(),
    turnstileToken: z.string().max(4096).optional(),
  })
  .strict();

export const aiGeneratePostSchema = z
  .object({
    message: z.string().min(1).max(8000),
    task: z
      .enum([
        'orchestration',
        'financial_guidance',
        'emotional_support',
        'document_analysis',
        'summarization',
        'structured_output',
      ])
      .optional(),
    context: z.record(z.string(), z.unknown()).optional(),
    sessionId: z.string().max(128).optional(),
    turnstileToken: z.string().max(4096).optional(),
  })
  .strict();

export const aiConsentPatchSchema = z
  .object({
    grantConsent: z.boolean().optional(),
    aiMemoryEnabled: z.boolean().optional(),
    aiOptOut: z.boolean().optional(),
  })
  .strict();
