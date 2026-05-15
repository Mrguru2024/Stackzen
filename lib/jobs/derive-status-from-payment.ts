import { JobDepositStatus, JobStatus } from '@prisma/client';
import { resolveDepositStatus, type JobDepositPolicyFields } from '@/lib/jobs/deposit-status';

const TERMINAL_STATUSES = new Set<JobStatus>([JobStatus.COMPLETED, JobStatus.CLOSED]);
const PRE_DEPOSIT_STATUSES = new Set<JobStatus>([
  JobStatus.NEW,
  JobStatus.QUOTED,
  JobStatus.APPROVED,
  JobStatus.DEPOSIT_PENDING,
]);

export type JobStatusDerivationInput = {
  currentStatus: JobStatus;
  policy: JobDepositPolicyFields;
  /** Sum of paid deposit invoice amounts on this job (USD, positive). */
  paidDepositTotal: number;
  /** Count of unpaid `standard` | `final` invoices on this job. */
  pendingNonDepositCount: number;
  /** Whether ANY non-deposit invoice exists (paid or unpaid). */
  hasAnyNonDepositInvoice: boolean;
  /** True iff the change that triggered derivation was an invoice payment FAILURE. */
  paymentFailed: boolean;
};

/**
 * Pure derivation of next `Job.status` after an invoice payment event.
 *
 * Rules:
 * - `COMPLETED` / `CLOSED` are terminal: never downgraded.
 * - Payment failure: regress only PAID → AWAITING_PAYMENT; everything else stays.
 * - If the job's deposit policy is not yet satisfied (deposit unpaid / partial),
 *   collapse pre-deposit statuses to `DEPOSIT_PENDING` and never auto-flip to PAID.
 * - Once the deposit is satisfied (or not required / waived):
 *   - No non-deposit invoice issued yet → `IN_PROGRESS` (work can start).
 *   - At least one non-deposit invoice still unpaid → `AWAITING_PAYMENT`.
 *   - All non-deposit invoices paid → `PAID`.
 */
export function deriveJobStatusFromPayment(input: JobStatusDerivationInput): JobStatus {
  const { currentStatus, paymentFailed } = input;

  if (TERMINAL_STATUSES.has(currentStatus)) return currentStatus;

  if (paymentFailed) {
    return currentStatus === JobStatus.PAID ? JobStatus.AWAITING_PAYMENT : currentStatus;
  }

  const depositStatus = resolveDepositStatus(input.policy, input.paidDepositTotal);
  const depositSatisfied =
    depositStatus === JobDepositStatus.PAID ||
    depositStatus === JobDepositStatus.WAIVED ||
    depositStatus === JobDepositStatus.NOT_REQUIRED;

  if (!depositSatisfied) {
    return PRE_DEPOSIT_STATUSES.has(currentStatus) ? JobStatus.DEPOSIT_PENDING : currentStatus;
  }

  if (!input.hasAnyNonDepositInvoice) {
    return PRE_DEPOSIT_STATUSES.has(currentStatus) ? JobStatus.IN_PROGRESS : currentStatus;
  }

  if (input.pendingNonDepositCount > 0) {
    return JobStatus.AWAITING_PAYMENT;
  }

  return JobStatus.PAID;
}
