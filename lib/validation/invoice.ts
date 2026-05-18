import { z } from 'zod';

/** Minimal quote create payload aligned with Prisma `Quote` model. */
export const quoteCreateSchema = z
  .object({
    title: z.string().min(1).max(500),
    content: z.string().min(1).max(50_000),
    status: z.string().max(64).default('draft'),
    jobId: z.string().cuid().optional(),
  })
  .strict();

export const invoiceCreateSchema = z
  .object({
    clientId: z.string().cuid(),
    amount: z.number().positive(),
    dueDate: z.string(),
    notes: z.string().max(5000).optional(),
    jobId: z.string().cuid().optional(),
    quoteId: z.string().cuid().optional(),
  })
  .strict();
