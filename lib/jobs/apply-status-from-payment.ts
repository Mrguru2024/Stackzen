import { prisma } from '@/lib/prisma';
import { recomputeJobRevenue } from '@/lib/jobs/revenue';
import type { JobDepositPolicyFields } from '@/lib/jobs/deposit-status';
import { deriveJobStatusFromPayment } from '@/lib/jobs/derive-status-from-payment';

/**
 * Side-effecting orchestrator called from the Stripe webhook whenever a job's
 * invoice payment state changes. Reads the job + all of its invoices, derives
 * the correct next `Job.status` via the pure helper, and writes it back —
 * respecting deposit policy so a paid deposit invoice never auto-flips a job
 * to PAID before the final invoice is settled.
 *
 * No-ops silently when the job is missing or user-scoped lookup fails (the
 * webhook should never throw on benign races).
 */
export async function applyJobStatusFromPaymentChange(
  jobId: string,
  userId: string,
  opts: { paymentFailed?: boolean } = {}
): Promise<void> {
  const job = await prisma.job.findFirst({
    where: { id: jobId, userId },
    select: {
      id: true,
      status: true,
      depositRequired: true,
      depositWaived: true,
      depositType: true,
      depositPercentage: true,
      depositFixedAmount: true,
      estimatedAmount: true,
    },
  });
  if (!job) return;

  await recomputeJobRevenue(jobId, userId);

  const invoices = await prisma.invoice.findMany({
    where: { jobId, userId },
    select: { invoiceType: true, status: true, amount: true },
  });

  let paidDepositTotal = 0;
  let pendingNonDepositCount = 0;
  let hasAnyNonDepositInvoice = false;
  for (const inv of invoices) {
    if (inv.invoiceType === 'deposit') {
      if (inv.status === 'paid') paidDepositTotal += inv.amount;
    } else {
      hasAnyNonDepositInvoice = true;
      if (inv.status !== 'paid') pendingNonDepositCount += 1;
    }
  }

  const policy: JobDepositPolicyFields = {
    depositRequired: job.depositRequired,
    depositWaived: job.depositWaived,
    depositType: job.depositType,
    depositPercentage: job.depositPercentage,
    depositFixedAmount: job.depositFixedAmount,
    estimatedAmount: job.estimatedAmount,
  };

  const nextStatus = deriveJobStatusFromPayment({
    currentStatus: job.status,
    policy,
    paidDepositTotal,
    pendingNonDepositCount,
    hasAnyNonDepositInvoice,
    paymentFailed: opts.paymentFailed ?? false,
  });

  if (nextStatus !== job.status) {
    await prisma.job.update({
      where: { id: jobId },
      data: { status: nextStatus },
    });
  }
}
