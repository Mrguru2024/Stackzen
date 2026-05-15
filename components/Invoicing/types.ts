import { z } from 'zod';

const createInvoiceSchema = z.object({
  clientId: z.string().min(1, 'Client is required'),
  clientName: z.string().optional(),
  clientEmail: z.string().optional(),
  invoiceNumber: z.string().optional(),
  dueDate: z.date({
    required_error: 'Due date is required',
    invalid_type_error: 'Invalid date format',
  }),
  status: z.enum(['draft', 'pending', 'paid', 'overdue']).optional(),
  terms: z.string().optional(),
  total: z.string().optional(),
  paymentMethod: z.enum(['online', 'offline']).optional(),
  paymentDetails: z
    .object({
      stripeEnabled: z.boolean().optional(),
      bankAccount: z.string().optional(),
      cashInstructions: z.string().optional(),
      checkPayableTo: z.string().optional(),
    })
    .optional(),
  lineItems: z
    .array(
      z.object({
        id: z.string().optional(),
        description: z.string().min(1, 'Description is required'),
        quantity: z.number().min(1, 'Quantity must be at least 1'),
        unitPrice: z.number().min(0, 'Unit price must be at least 0'),
        amount: z.number(),
      })
    )
    .min(1, 'At least one line item is required'),
  notes: z.string().optional(),
});

export type CreateInvoiceFormValues = z.infer<typeof createInvoiceSchema>;

export interface Invoice {
  id: string;
  invoiceNumber: string;
  total: number;
  amount: number;
  status: 'draft' | 'pending' | 'paid' | 'overdue';
  dueDate: Date;
  createdAt: Date;
  updatedAt: Date;
  paidAt?: Date;
  paid: boolean;
  stripePaymentIntent?: string;
  notes?: string;
  terms?: string;
  clientId: string;
  clientName: string;
  clientEmail?: string;
  client: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
  };
  lineItems: {
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
  }[];
}

export interface InvoiceSummary {
  totalInvoices: number;
  totalPaid: number;
  totalOverdue: number;
  totalDraft: number;
  totalAmount: number;
  paidAmount: number;
  overdueAmount: number;
  draftAmount: number;
}

export { createInvoiceSchema };
