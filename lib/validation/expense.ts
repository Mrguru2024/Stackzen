import { z } from 'zod';

export const expenseCreateSchema = z
  .object({
    date: z.string().transform(str => new Date(str)),
    description: z.string().min(1, 'Description is required'),
    category: z.string().min(1, 'Category is required'),
    amount: z.number().positive('Amount must be positive'),
    tags: z.array(z.string()).optional(),
    notes: z.string().optional(),
    receiptUrl: z.string().optional(),
    isRecurring: z.boolean().optional(),
    frequency: z.string().optional(),
    nextDueDate: z
      .string()
      .transform(str => new Date(str))
      .optional(),
    jobId: z.string().cuid().optional(),
  })
  .strict();
