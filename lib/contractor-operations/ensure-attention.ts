import type { Prisma } from '@prisma/client';
import { AutomationNotificationType, NotificationSeverity } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { createAutomationNotification } from '@/lib/financial-automation/rules-engine';
import { buildOperationalAttentionMetadata } from '@/lib/financial-automation/actionable-metadata';
import { mergeNotificationMetadata } from '@/lib/operational-integrity/metadata';
import { buildContractorFinancialOpsSnapshot } from '@/lib/contractor-operations/snapshot';
import type { ContractorFinancialOpsSnapshotDto } from '@/lib/contractor-operations/types';

const KIND_MATERIAL = 'contractor_ops_material_exposure';
const KIND_MARGIN = 'contractor_ops_negative_job_margin';
const KIND_RECEIVABLE = 'contractor_ops_receivable_concentration';

function findExisting(userId: string, attentionKind: string) {
  return prisma.automationNotification.findFirst({
    where: {
      userId,
      metadata: { path: ['attentionKind'], equals: attentionKind },
    },
    select: { id: true, readAt: true, metadata: true },
  });
}

async function markReadIfExists(userId: string, attentionKind: string, reason: string): Promise<void> {
  const existing = await findExisting(userId, attentionKind);
  if (existing && !existing.readAt) {
    const md = mergeNotificationMetadata(existing.metadata, {
      autoResolvedAt: new Date().toISOString(),
      autoResolvedReason: reason,
    });
    await prisma.automationNotification.update({
      where: { id: existing.id },
      data: { readAt: new Date(), metadata: md as unknown as Prisma.InputJsonValue },
    });
  }
}

/**
 * Portfolio-level contractor operational signals (does not duplicate per-invoice/job rows from ensureOperationalAttentionNotifications).
 */
export async function ensureContractorOperationalAttentionNotifications(
  userId: string,
  cached?: ContractorFinancialOpsSnapshotDto
): Promise<void> {
  const snap = cached ?? (await buildContractorFinancialOpsSnapshot(userId));

  if (!snap.hasContractorContext) {
    await markReadIfExists(userId, KIND_MATERIAL, 'contractor_ops_no_business_context');
    await markReadIfExists(userId, KIND_MARGIN, 'contractor_ops_no_business_context');
    await markReadIfExists(userId, KIND_RECEIVABLE, 'contractor_ops_no_business_context');
    return;
  }

  const actions = [
    { type: 'OPEN_CASH_FLOW' as const },
    { type: 'OPEN_MONEY_CONTROL' as const, tab: 'review' as const },
  ];

  if (snap.materialExposure.length === 0) {
    await markReadIfExists(userId, KIND_MATERIAL, 'contractor_ops_no_material_exposure');
  } else {
    const top = snap.materialExposure.slice(0, 4);
    const title = 'Contractor ops · material spend ahead of deposit coverage';
    const body =
      top
        .map(m => `${m.title}: expenses $${m.jobExpenses.toFixed(2)} vs deposit $${m.depositPaid.toFixed(2)}`)
        .join(' · ') + ' — pause discretionary job spend until deposit policy is satisfied.';
    const meta = buildOperationalAttentionMetadata(
      [...actions, ...top.map(m => ({ type: 'OPEN_JOB' as const, jobId: m.jobId }))],
      {
        attentionKind: KIND_MATERIAL,
        trust: {
          why: 'Job rows show expenses exceeding collected deposit while the deposit gate is still open.',
          whatChanged: top.map(m => m.jobId).join(', '),
          recommendedNextStep: 'Collect the deposit invoice, then reconcile expenses in Money Control.',
          sourceEventType: 'CONTRACTOR_OPS_MATERIAL',
        },
      }
    ) as Record<string, unknown>;
    meta.contractorOps = { material: top, generatedAt: snap.generatedAt };

    const existing = await findExisting(userId, KIND_MATERIAL);
    if (existing) {
      await prisma.automationNotification.update({
        where: { id: existing.id },
        data: {
          title,
          body,
          severity: NotificationSeverity.WARNING,
          readAt: null,
          metadata: meta as unknown as Prisma.InputJsonValue,
        },
      });
    } else {
      await createAutomationNotification({
        userId,
        type: AutomationNotificationType.AUTOMATION_ACTION,
        severity: NotificationSeverity.WARNING,
        title,
        body,
        metadata: meta as unknown as Prisma.InputJsonValue,
      });
    }
  }

  if (snap.negativeMarginJobs.length === 0) {
    await markReadIfExists(userId, KIND_MARGIN, 'contractor_ops_no_negative_margin');
  } else {
    const top = snap.negativeMarginJobs.slice(0, 4);
    const title = 'Contractor ops · negative job margin on active work';
    const body =
      top
        .map(
          j =>
            `${j.title}: profit $${j.estimatedProfit.toFixed(2)} (rev $${j.jobRevenue.toFixed(2)} − exp $${j.jobExpenses.toFixed(2)})`
        )
        .join(' · ') + ' — review pricing, scope, or expenses before taking new material risk.';
    const meta = buildOperationalAttentionMetadata(
      [...actions, ...top.map(j => ({ type: 'OPEN_JOB' as const, jobId: j.jobId }))],
      {
        attentionKind: KIND_MARGIN,
        trust: {
          why: 'estimatedProfit on Job is negative for active statuses while using recomputed jobRevenue and jobExpenses.',
          whatChanged: top.map(j => j.jobId).join(', '),
          recommendedNextStep: 'Open each job to align invoices and recorded expenses with delivery reality.',
          sourceEventType: 'CONTRACTOR_OPS_MARGIN',
        },
      }
    ) as Record<string, unknown>;
    meta.contractorOps = { negativeMargin: top, generatedAt: snap.generatedAt };

    const existing = await findExisting(userId, KIND_MARGIN);
    if (existing) {
      await prisma.automationNotification.update({
        where: { id: existing.id },
        data: {
          title,
          body,
          severity: NotificationSeverity.WARNING,
          readAt: null,
          metadata: meta as unknown as Prisma.InputJsonValue,
        },
      });
    } else {
      await createAutomationNotification({
        userId,
        type: AutomationNotificationType.AUTOMATION_ACTION,
        severity: NotificationSeverity.WARNING,
        title,
        body,
        metadata: meta as unknown as Prisma.InputJsonValue,
      });
    }
  }

  const conc = snap.receivableConcentration;
  const hasConc = conc.openInvoiceCount >= 2 && conc.herfindahlIndex >= 0.5;
  if (!hasConc) {
    await markReadIfExists(userId, KIND_RECEIVABLE, 'contractor_ops_receivable_concentration_ok');
  } else {
    const top = conc.topClients[0];
    const title = 'Contractor ops · receivable concentration';
    const body = `Open AR is concentrated: HHI ≈ ${conc.herfindahlIndex.toFixed(2)} across ${conc.openInvoiceCount} invoice(s). Largest payer share ≈ ${((top?.share ?? 0) * 100).toFixed(1)}%.`;
    const invActions = (top?.invoiceIds ?? []).slice(0, 3).map(id => ({ type: 'OPEN_INVOICE' as const, invoiceId: id }));
    const meta = buildOperationalAttentionMetadata([...actions, ...invActions], {
      attentionKind: KIND_RECEIVABLE,
      trust: {
        why: 'Deterministic Herfindahl index on unpaid invoice totals grouped by clientId.',
        whatChanged: `Top client ${top?.clientId ?? 'n/a'}`,
        recommendedNextStep: 'Stagger deliverables and invoice timing to reduce single-payer cash risk.',
        sourceEventType: 'CONTRACTOR_OPS_RECEIVABLE',
      },
    }) as Record<string, unknown>;
    meta.contractorOps = { concentration: conc, generatedAt: snap.generatedAt };

    const existing = await findExisting(userId, KIND_RECEIVABLE);
    if (existing) {
      await prisma.automationNotification.update({
        where: { id: existing.id },
        data: {
          title,
          body,
          severity: NotificationSeverity.INFO,
          readAt: null,
          metadata: meta as unknown as Prisma.InputJsonValue,
        },
      });
    } else {
      await createAutomationNotification({
        userId,
        type: AutomationNotificationType.AUTOMATION_ACTION,
        severity: NotificationSeverity.INFO,
        title,
        body,
        metadata: meta as unknown as Prisma.InputJsonValue,
      });
    }
  }
}
