import {
  FinancialEntityType,
  FinancialEventSource,
  FinancialEventType,
  JobDepositStatus,
} from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { createFinancialEventSafe } from '@/lib/financial-events/events';
import { resolveDepositStatus } from '@/lib/jobs/deposit-status';

const PAID_STATUS = 'paid';

export async function recomputeJobRevenue(jobId: string, userId: string): Promise<void> {
  const job = await prisma.job.findFirst({
    where: { id: jobId, userId },
    select: {
      id: true,
      estimatedAmount: true,
      depositRequired: true,
      depositWaived: true,
      depositType: true,
      depositPercentage: true,
      depositFixedAmount: true,
      depositStatus: true,
    },
  });
  if (!job) return;

  const previousDepositStatus = job.depositStatus;

  const [paidInvoices, allExpenses] = await Promise.all([
    prisma.invoice.findMany({
      where: { jobId, userId, status: PAID_STATUS },
      select: { amount: true, invoiceType: true },
    }),
    prisma.expense.findMany({
      where: { jobId, userId },
      select: { amount: true },
    }),
  ]);

  const jobRevenue = paidInvoices.reduce((sum, invoice) => sum + invoice.amount, 0);
  const depositPaid = paidInvoices
    .filter(invoice => invoice.invoiceType === 'deposit')
    .reduce((sum, invoice) => sum + invoice.amount, 0);
  const jobExpenses = allExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const contractValue = job.estimatedAmount ?? jobRevenue;
  const remainingBalance = Math.max(contractValue - depositPaid, 0);
  const estimatedProfit = jobRevenue - jobExpenses;

  const depositStatus = resolveDepositStatus(job, depositPaid);

  await prisma.job.update({
    where: { id: jobId },
    data: {
      depositPaid,
      remainingBalance,
      jobRevenue,
      jobExpenses,
      estimatedProfit,
      depositStatus,
    },
  });

  if (
    job.depositRequired &&
    previousDepositStatus !== JobDepositStatus.PAID &&
    depositStatus === JobDepositStatus.PAID
  ) {
    await createFinancialEventSafe({
      userId,
      type: FinancialEventType.JOB_DEPOSIT_PAID,
      source: FinancialEventSource.API_JOBS,
      relatedEntityType: FinancialEntityType.JOB,
      relatedEntityId: jobId,
      amount: depositPaid,
      metadata: {
        jobId,
        depositPaid,
        previousDepositStatus,
      },
    });
  }
}
