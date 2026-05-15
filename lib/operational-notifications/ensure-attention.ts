import {
  AutomationNotificationType,
  FinancialEntityType,
  JobStatus,
  NotificationSeverity,
} from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { createAutomationNotification } from '@/lib/financial-automation/rules-engine';
import { buildOperationalAttentionMetadata } from '@/lib/financial-automation/actionable-metadata';

/**
 * Idempotent creation of business-critical operational notifications that should
 * always exist while the underlying invoice/job state requires money action.
 */
export async function ensureOperationalAttentionNotifications(userId: string): Promise<void> {
  const now = new Date();
  const horizon = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const overdueInvoices = await prisma.invoice.findMany({
    where: {
      userId,
      status: { notIn: ['paid', 'failed'] },
      dueDate: { lt: now },
    },
    select: { id: true, number: true, amount: true, dueDate: true, clientId: true, jobId: true },
    orderBy: { dueDate: 'asc' },
    take: 25,
  });

  for (const inv of overdueInvoices) {
    const dup = await prisma.automationNotification.findFirst({
      where: {
        userId,
        relatedEntityType: FinancialEntityType.INVOICE,
        relatedEntityId: inv.id,
        metadata: { path: ['attentionKind'], equals: 'invoice_overdue' },
      },
      select: { id: true },
    });
    if (dup) continue;

    await createAutomationNotification({
      userId,
      type: AutomationNotificationType.AUTOMATION_ACTION,
      severity: NotificationSeverity.CRITICAL,
      title: `Invoice ${inv.number} is overdue`,
      body: `Outstanding $${inv.amount.toFixed(2)} was due ${inv.dueDate.toLocaleDateString()}. Record payment or follow up with your client.`,
      relatedEntityType: FinancialEntityType.INVOICE,
      relatedEntityId: inv.id,
      metadata: buildOperationalAttentionMetadata(
        [
          { type: 'OPEN_INVOICE', invoiceId: inv.id },
          ...(inv.jobId ? [{ type: 'OPEN_JOB' as const, jobId: inv.jobId }] : []),
          { type: 'OPEN_CLIENT', clientId: inv.clientId },
          { type: 'PAY_INVOICE', invoiceId: inv.id },
        ],
        {
          attentionKind: 'invoice_overdue',
          trust: {
            why: 'The invoice due date has passed and the invoice is not marked paid.',
            whatChanged: `Due date was ${inv.dueDate.toLocaleDateString()}.`,
            recommendedNextStep: 'Open the invoice to record payment or send a follow-up.',
          },
        }
      ),
    });
  }

  const dueSoon = await prisma.invoice.findMany({
    where: {
      userId,
      status: { notIn: ['paid', 'failed'] },
      dueDate: { gte: now, lte: horizon },
    },
    select: { id: true, number: true, amount: true, dueDate: true, clientId: true, jobId: true },
    orderBy: { dueDate: 'asc' },
    take: 25,
  });

  for (const inv of dueSoon) {
    const dup = await prisma.automationNotification.findFirst({
      where: {
        userId,
        relatedEntityType: FinancialEntityType.INVOICE,
        relatedEntityId: inv.id,
        metadata: { path: ['attentionKind'], equals: 'invoice_due_soon' },
      },
      select: { id: true },
    });
    if (dup) continue;

    await createAutomationNotification({
      userId,
      type: AutomationNotificationType.AUTOMATION_ACTION,
      severity: NotificationSeverity.WARNING,
      title: `Invoice ${inv.number} due soon`,
      body: `$${inv.amount.toFixed(2)} is due ${inv.dueDate.toLocaleDateString()}. Confirm payment or send the invoice.`,
      relatedEntityType: FinancialEntityType.INVOICE,
      relatedEntityId: inv.id,
      metadata: buildOperationalAttentionMetadata(
        [
          { type: 'OPEN_INVOICE', invoiceId: inv.id },
          ...(inv.jobId ? [{ type: 'OPEN_JOB' as const, jobId: inv.jobId }] : []),
          { type: 'OPEN_CLIENT', clientId: inv.clientId },
        ],
        {
          attentionKind: 'invoice_due_soon',
          trust: {
            why: 'The due date is within the next seven days.',
            recommendedNextStep: 'Review the invoice and client follow-up before cash falls through the cracks.',
          },
        }
      ),
    });
  }

  const jobsNeeding = await prisma.job.findMany({
    where: {
      userId,
      status: { in: [JobStatus.DEPOSIT_PENDING, JobStatus.AWAITING_PAYMENT] },
    },
    select: { id: true, title: true, status: true, clientId: true },
    orderBy: { updatedAt: 'desc' },
    take: 25,
  });

  for (const job of jobsNeeding) {
    const attentionKind =
      job.status === JobStatus.DEPOSIT_PENDING ? 'job_deposit_required' : 'job_awaiting_payment';

    const dup = await prisma.automationNotification.findFirst({
      where: {
        userId,
        relatedEntityType: FinancialEntityType.JOB,
        relatedEntityId: job.id,
        metadata: { path: ['attentionKind'], equals: attentionKind },
      },
      select: { id: true },
    });
    if (dup) continue;

    const openInvoice = await prisma.invoice.findFirst({
      where: {
        userId,
        jobId: job.id,
        status: { notIn: ['paid', 'failed'] },
      },
      select: { id: true },
      orderBy: { createdAt: 'desc' },
    });

    const title =
      job.status === JobStatus.DEPOSIT_PENDING
        ? `Deposit pending · ${job.title}`
        : `Awaiting payment · ${job.title}`;
    const body =
      job.status === JobStatus.DEPOSIT_PENDING
        ? 'Collect the configured deposit before work proceeds.'
        : 'Final or balance invoicing likely outstanding for this job.';

    await createAutomationNotification({
      userId,
      type: AutomationNotificationType.AUTOMATION_ACTION,
      severity:
        job.status === JobStatus.DEPOSIT_PENDING ? NotificationSeverity.WARNING : NotificationSeverity.INFO,
      title,
      body,
      relatedEntityType: FinancialEntityType.JOB,
      relatedEntityId: job.id,
      metadata: buildOperationalAttentionMetadata(
        [
          { type: 'OPEN_JOB', jobId: job.id },
          { type: 'OPEN_CLIENT', clientId: job.clientId },
          ...(openInvoice ? [{ type: 'PAY_INVOICE' as const, invoiceId: openInvoice.id }] : []),
        ],
        {
          attentionKind,
          trust: {
            why: 'Job lifecycle indicates cash is still owed or a deposit gate is active.',
            recommendedNextStep: openInvoice
              ? 'Open the linked invoice or take payment.'
              : 'Open the job to issue or verify the correct invoice.',
          },
        }
      ),
    });
  }
}
