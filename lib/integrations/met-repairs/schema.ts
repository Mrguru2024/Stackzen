import { z } from 'zod';

const money = z.coerce.number().finite();
const optionalMoney = z.coerce.number().finite().optional().default(0);

/** Accepts StackZen-normalized and MET Repairs OS (`MetJobFinancialRecord`) field names. */
export const metRepairJobSchema = z
  .object({
    id: z.string().optional(),
    jobId: z.string().optional(),
    workOrderId: z.string().nullable().optional(),
    workOrderLabel: z.string().optional(),
    workOrderNumber: z.string().optional(),
    clientName: z.string().optional(),
    customerName: z.string().nullable().optional(),
    status: z.string().min(1),
    revenue: money,
    expenses: optionalMoney,
    laborCost: optionalMoney,
    materialCost: optionalMoney,
    contractorPayout: optionalMoney,
    stripeFees: optionalMoney,
    leadCost: optionalMoney,
    otherExpenses: optionalMoney,
    leadSource: z.string().nullable().optional(),
    completedAt: z.string().nullable().optional(),
    invoicedAt: z.string().nullable().optional(),
    depositReceived: optionalMoney,
    depositCollected: optionalMoney,
    depositAmount: optionalMoney,
    contractorId: z.string().nullable().optional(),
    contractorName: z.string().nullable().optional(),
  })
  .passthrough()
  .refine(row => Boolean(row.id ?? row.jobId), { message: 'Missing job id' })
  .refine(row => Boolean(row.clientName ?? row.customerName), { message: 'Missing client name' });

export const metRepairInvoiceSchema = z
  .object({
    id: z.string().optional(),
    invoiceId: z.string().optional(),
    invoiceLabel: z.string().optional(),
    invoiceNumber: z.string().optional(),
    clientName: z.string().optional(),
    customerName: z.string().nullable().optional(),
    jobId: z.string().nullable().optional(),
    total: money.optional(),
    invoiceTotal: money.optional(),
    paid: optionalMoney,
    amountPaid: optionalMoney,
    balance: optionalMoney,
    balanceDue: optionalMoney,
    dueDate: z.string().nullable().optional(),
    status: z.string().min(1),
  })
  .passthrough()
  .refine(row => Boolean(row.id ?? row.invoiceId), { message: 'Missing invoice id' })
  .refine(row => row.total != null || row.invoiceTotal != null, { message: 'Missing invoice total' })
  .refine(row => Boolean(row.clientName ?? row.customerName), { message: 'Missing client name' });

export const metRepairPaymentSchema = z
  .object({
    id: z.string().optional(),
    paymentId: z.string().optional(),
    amount: money,
    jobId: z.string().nullable().optional(),
    invoiceId: z.string().nullable().optional(),
    paidAt: z.string().nullable().optional(),
    createdAt: z.string().optional(),
    method: z.string().nullable().optional(),
    kind: z.string().optional(),
  })
  .passthrough()
  .refine(row => Boolean(row.id ?? row.paymentId), { message: 'Missing payment id' });

export const metRepairExpenseSchema = z
  .object({
    id: z.string().optional(),
    expenseId: z.string().optional(),
    amount: money,
    jobId: z.string().nullable().optional(),
    workOrderId: z.string().nullable().optional(),
    category: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
    vendorName: z.string().nullable().optional(),
    incurredAt: z.string().nullable().optional(),
    createdAt: z.string().optional(),
  })
  .passthrough()
  .refine(row => Boolean(row.id ?? row.expenseId), { message: 'Missing expense id' });

export const metRepairContractorSchema = z
  .object({
    id: z.string().optional(),
    contractorId: z.string().optional(),
    name: z.string().min(1),
    jobsCompleted: z.coerce.number().int().nonnegative().optional().default(0),
    jobsAssigned: z.coerce.number().int().nonnegative().optional(),
    totalPayout: optionalMoney,
    averagePayoutPerJob: optionalMoney,
    averageProfitPerJob: optionalMoney,
    reliabilityScore: z.coerce.number().finite().nullable().optional(),
  })
  .passthrough()
  .refine(row => Boolean(row.id ?? row.contractorId), { message: 'Missing contractor id' });

export const metRepairFinancialSummarySchema = z
  .object({
    revenue: optionalMoney,
    revenueTotal: optionalMoney,
    totalExpenses: optionalMoney,
    grossProfit: optionalMoney,
    netProfit: optionalMoney,
    netProfitTotal: optionalMoney,
    profitMargin: optionalMoney,
    averageProfitMargin: optionalMoney,
    unpaidInvoiceTotal: optionalMoney,
    completedNotInvoicedTotal: optionalMoney,
    completedNotInvoicedCount: z.coerce.number().int().nonnegative().optional(),
    contractorPayoutTotal: optionalMoney,
    jobsLosingMoneyCount: z.coerce.number().int().nonnegative().optional().default(0),
    averageMargin: optionalMoney,
    laborCostTotal: optionalMoney,
    materialCostTotal: optionalMoney,
    stripeFeesTotal: optionalMoney,
    leadCostTotal: optionalMoney,
    otherExpensesTotal: optionalMoney,
  })
  .passthrough();

export const metRepairCommandCenterSnapshotSchema = z.object({
  fetchedAt: z.string().optional(),
  summary: metRepairFinancialSummarySchema.optional(),
  leadSourceRoi: z.array(z.record(z.unknown())).optional(),
  jobProfitability: z.array(z.record(z.unknown())).optional(),
  contractorPayouts: z.array(z.record(z.unknown())).optional(),
  unpaidInvoices: z.array(metRepairInvoiceSchema).optional(),
  alerts: z.array(z.record(z.unknown())).optional(),
  jobs: z.array(metRepairJobSchema).optional(),
  invoices: z.array(metRepairInvoiceSchema).optional(),
  payments: z.array(metRepairPaymentSchema).optional(),
  expenses: z.array(metRepairExpenseSchema).optional(),
  contractors: z.array(metRepairContractorSchema).optional(),
});

export type MetRepairCommandCenterDto = z.infer<typeof metRepairCommandCenterSnapshotSchema>;

function listPayload<T extends z.ZodTypeAny>(itemSchema: T) {
  return z.union([
    z.array(itemSchema),
    z.object({ data: z.array(itemSchema) }),
    z.object({ items: z.array(itemSchema) }),
    z.object({ results: z.array(itemSchema) }),
  ]);
}

function singlePayload<T extends z.ZodTypeAny>(itemSchema: T) {
  return z.union([itemSchema, z.object({ data: itemSchema })]);
}

export const metRepairJobListSchema = listPayload(metRepairJobSchema);
export const metRepairInvoiceListSchema = listPayload(metRepairInvoiceSchema);
export const metRepairPaymentListSchema = listPayload(metRepairPaymentSchema);
export const metRepairExpenseListSchema = listPayload(metRepairExpenseSchema);
export const metRepairContractorListSchema = listPayload(metRepairContractorSchema);
export const metRepairSummaryResponseSchema = singlePayload(metRepairFinancialSummarySchema);

export type MetRepairJobDto = z.infer<typeof metRepairJobSchema>;
export type MetRepairInvoiceDto = z.infer<typeof metRepairInvoiceSchema>;
export type MetRepairPaymentDto = z.infer<typeof metRepairPaymentSchema>;
export type MetRepairExpenseDto = z.infer<typeof metRepairExpenseSchema>;
export type MetRepairContractorDto = z.infer<typeof metRepairContractorSchema>;
export type MetRepairFinancialSummaryDto = z.infer<typeof metRepairFinancialSummarySchema>;

export function unwrapList<T>(parsed: T[] | { data: T[] } | { items: T[] } | { results: T[] }): T[] {
  if (Array.isArray(parsed)) return parsed;
  if ('data' in parsed) return parsed.data;
  if ('items' in parsed) return parsed.items;
  return parsed.results;
}

export function unwrapSingle<T>(parsed: T | { data: T }): T {
  if (parsed && typeof parsed === 'object' && 'data' in parsed) {
    return (parsed as { data: T }).data;
  }
  return parsed as T;
}

export function mapJobDto(dto: MetRepairJobDto) {
  const id = dto.id ?? dto.jobId ?? '';
  const clientName = (dto.clientName ?? dto.customerName ?? 'Unknown client').trim();
  const componentExpenses =
    (dto.laborCost ?? 0) +
    (dto.materialCost ?? 0) +
    (dto.contractorPayout ?? 0) +
    (dto.stripeFees ?? 0) +
    (dto.leadCost ?? 0) +
    (dto.otherExpenses ?? 0);
  const expenses = componentExpenses > 0 ? componentExpenses : (dto.expenses ?? 0);

  return {
    id,
    workOrderLabel:
      dto.workOrderLabel ?? dto.workOrderNumber ?? dto.workOrderId ?? id,
    clientName,
    status: dto.status,
    revenue: dto.revenue,
    expenses,
    leadSource: dto.leadSource ?? null,
    leadCost: dto.leadCost ?? 0,
    completedAt: dto.completedAt ?? null,
    invoicedAt: dto.invoicedAt ?? null,
    depositReceived: dto.depositReceived ?? dto.depositCollected ?? dto.depositAmount ?? 0,
    materialCost: dto.materialCost ?? 0,
    contractorId: dto.contractorId ?? null,
    contractorName: dto.contractorName ?? null,
  };
}

export function mapInvoiceDto(dto: MetRepairInvoiceDto) {
  const id = dto.id ?? dto.invoiceId ?? '';
  const total = dto.total ?? dto.invoiceTotal ?? 0;
  const paid = dto.paid ?? dto.amountPaid ?? 0;
  const balance = dto.balance ?? dto.balanceDue ?? Math.max(0, total - paid);
  const clientName = (dto.clientName ?? dto.customerName ?? 'Unknown client').trim();

  return {
    id,
    invoiceLabel: dto.invoiceLabel ?? dto.invoiceNumber ?? id,
    clientName,
    jobId: dto.jobId ?? null,
    total,
    paid,
    balance,
    dueDate: dto.dueDate ?? null,
    status: dto.status,
  };
}

export function mapPaymentDto(dto: MetRepairPaymentDto) {
  return {
    id: dto.id ?? dto.paymentId ?? '',
    amount: dto.amount,
    jobId: dto.jobId ?? null,
    invoiceId: dto.invoiceId ?? null,
    paidAt: dto.paidAt ?? dto.createdAt ?? new Date().toISOString(),
    method: dto.method ?? dto.kind ?? null,
  };
}

export function mapExpenseDto(dto: MetRepairExpenseDto) {
  return {
    id: dto.id ?? dto.expenseId ?? '',
    amount: dto.amount,
    jobId: dto.jobId ?? dto.workOrderId ?? null,
    category: dto.category ?? null,
    description: dto.description ?? dto.vendorName ?? null,
    incurredAt: dto.incurredAt ?? dto.createdAt ?? null,
  };
}

export function mapContractorDto(dto: MetRepairContractorDto) {
  return {
    id: dto.id ?? dto.contractorId ?? '',
    name: dto.name,
    jobsCompleted: dto.jobsCompleted ?? 0,
    totalPayout: dto.totalPayout ?? 0,
    reliabilityScore: dto.reliabilityScore ?? null,
  };
}

export function mapFinancialSummaryDto(dto: MetRepairFinancialSummaryDto) {
  const revenue = dto.revenue ?? dto.revenueTotal ?? 0;
  const totalExpenses =
    dto.totalExpenses ??
    (dto.laborCostTotal ?? 0) +
      (dto.materialCostTotal ?? 0) +
      (dto.contractorPayoutTotal ?? 0) +
      (dto.stripeFeesTotal ?? 0) +
      (dto.leadCostTotal ?? 0) +
      (dto.otherExpensesTotal ?? 0);
  const netProfit = dto.netProfit ?? dto.netProfitTotal ?? revenue - totalExpenses;
  const grossProfit = dto.grossProfit ?? revenue - totalExpenses;
  const profitMargin = dto.profitMargin ?? dto.averageProfitMargin ?? 0;
  const averageMargin = dto.averageMargin ?? dto.averageProfitMargin ?? profitMargin;

  return {
    revenue,
    totalExpenses,
    grossProfit,
    netProfit,
    profitMargin,
    unpaidInvoiceTotal: dto.unpaidInvoiceTotal ?? 0,
    completedNotInvoicedTotal: dto.completedNotInvoicedTotal ?? 0,
    contractorPayoutTotal: dto.contractorPayoutTotal ?? 0,
    jobsLosingMoneyCount: dto.jobsLosingMoneyCount ?? 0,
    averageMargin,
  };
}
