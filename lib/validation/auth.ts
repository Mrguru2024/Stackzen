import { z } from 'zod';

export const signupBodySchema = z
  .object({
    name: z.string().min(2).max(200),
    email: z.string().email().max(320),
    password: z.string().min(8).max(200),
    plan: z.string().max(32).optional(),
    cycle: z.string().max(16).optional(),
    country: z.string().max(100).optional(),
    state: z.string().max(100).optional(),
    turnstileToken: z.string().max(4096).optional(),
  })
  .strict();

export const requestResetBodySchema = z
  .object({
    email: z.string().email().max(320),
    turnstileToken: z.string().max(4096).optional(),
  })
  .strict();

export const resetPasswordBodySchema = z
  .object({
    token: z.string().min(1).max(512),
    password: z.string().min(8).max(200),
    turnstileToken: z.string().max(4096).optional(),
  })
  .strict();
