import { z } from 'zod';

export const incomeLedgerCreateSchema = z
  .object({
    amount: z.number().positive().max(1_000_000_000),
    date: z.string().min(1),
    source: z.string().min(1).max(200),
    notes: z.string().max(2000).optional().nullable(),
  })
  .strict();
