import { JobDepositStatus, JobDepositType, type Job } from '@prisma/client';

export type JobDepositPolicyFields = Pick<
  Job,
  | 'depositRequired'
  | 'depositWaived'
  | 'depositType'
  | 'depositPercentage'
  | 'depositFixedAmount'
  | 'estimatedAmount'
>;

const EPS = 0.01;

/** Expected deposit amount for the job policy, or null if not computable. */
export function getRequiredDepositAmount(job: JobDepositPolicyFields): number | null {
  if (!job.depositRequired || job.depositType === JobDepositType.NONE) {
    return null;
  }
  if (job.depositWaived) {
    return null;
  }
  if (job.depositType === JobDepositType.FIXED_AMOUNT) {
    const fixed = job.depositFixedAmount;
    return typeof fixed === 'number' && fixed > 0 ? fixed : null;
  }
  if (job.depositType === JobDepositType.PERCENTAGE) {
    const pct = job.depositPercentage ?? 0;
    const est = job.estimatedAmount;
    if (!est || est <= 0 || pct <= 0) return null;
    return Number(((est * pct) / 100).toFixed(2));
  }
  return null;
}

/** Derive deposit compliance from paid deposit invoices (sum of paid `invoiceType === deposit`). */
export function resolveDepositStatus(
  job: JobDepositPolicyFields,
  paidDepositTotal: number
): JobDepositStatus {
  if (!job.depositRequired || job.depositType === JobDepositType.NONE) {
    return JobDepositStatus.NOT_REQUIRED;
  }
  if (job.depositWaived) {
    return JobDepositStatus.WAIVED;
  }
  const required = getRequiredDepositAmount(job);
  if (required == null || required <= 0) {
    return JobDepositStatus.REQUIRED_UNPAID;
  }
  if (paidDepositTotal + EPS >= required) {
    return JobDepositStatus.PAID;
  }
  if (paidDepositTotal > EPS) {
    return JobDepositStatus.PARTIALLY_PAID;
  }
  return JobDepositStatus.REQUIRED_UNPAID;
}

export function canStartWorkWhileDepositRequired(status: JobDepositStatus): boolean {
  return status === JobDepositStatus.PAID || status === JobDepositStatus.WAIVED;
}
