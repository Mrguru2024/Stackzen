import { NextResponse } from 'next/server';
import {
  AutomationNotificationType,
  FinancialEntityType,
  NotificationSeverity,
  type Prisma,
} from '@prisma/client';
import { requireAuthSession } from '@/lib/api/require-auth';
import { prisma } from '@/lib/prisma';
import { buildCashFlowForecast } from '@/lib/cashflow/forecast';
import { createAutomationNotification } from '@/lib/financial-automation/rules-engine';
import { buildOperationalAttentionMetadata } from '@/lib/financial-automation/actionable-metadata';
import { fingerprintForShiftBill } from '@/lib/operational-actions/fingerprint';
import type { OperationalActionProposalCore } from '@/lib/operational-actions/types';

function parseIsoDate(value: unknown): Date | null {
  if (typeof value !== 'string' || value.length < 10) return null;
  const d = new Date(value);
  return Number.isFinite(d.getTime()) ? d : null;
}

/**
 * Creates a SHIFT_RECURRING_BILL_DATE proposal as an AutomationNotification.
 * Does NOT mutate the RecurringBill — the apply step is still user-approved.
 */
export async function POST(request: Request) {
  const { session, response } = await requireAuthSession();
  if (response) return response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }
  const { billId, proposedDate } = body as Record<string, unknown>;
  if (typeof billId !== 'string' || !billId) {
    return NextResponse.json({ error: 'billId required' }, { status: 400 });
  }
  const proposed = parseIsoDate(proposedDate);
  if (!proposed) {
    return NextResponse.json({ error: 'proposedDate must be ISO date' }, { status: 400 });
  }
  if (proposed < new Date(new Date().setUTCHours(0, 0, 0, 0))) {
    return NextResponse.json({ error: 'proposedDate must be in the future' }, { status: 400 });
  }

  const bill = await prisma.recurringBill.findFirst({
    where: { id: billId, userId: session.user.id, enabled: true },
  });
  if (!bill) {
    return NextResponse.json({ error: 'Bill not found' }, { status: 404 });
  }
  if (proposed.toISOString().slice(0, 10) === bill.nextDueDate.toISOString().slice(0, 10)) {
    return NextResponse.json({ error: 'proposedDate matches current nextDueDate' }, { status: 400 });
  }

  const forecast = await buildCashFlowForecast(session.user.id, { includeDetails: false });
  const fingerprint = fingerprintForShiftBill({
    forecastGeneratedAt: forecast.generatedAt,
    billId: bill.id,
    proposedDate: proposed.toISOString(),
  });

  const proposal: OperationalActionProposalCore = {
    version: 1,
    status: 'pending',
    kind: 'SHIFT_RECURRING_BILL_DATE',
    fingerprint,
    lastForecastGeneratedAt: forecast.generatedAt,
    payload: {
      billId: bill.id,
      billName: bill.name,
      previousDate: bill.nextDueDate.toISOString(),
      proposedDate: proposed.toISOString(),
      amount: bill.amount,
    },
    explain: {
      why: 'User drag-and-dropped this bill on the timing calendar to propose a new due date.',
      dataInfluences: [
        'RecurringBill.nextDueDate',
        'RecurringBill.frequency',
        'buildCashFlowForecast (for fingerprint pinning)',
      ],
      calculations: [
        'Fingerprint = sha(forecastGeneratedAt|SHIFT_RECURRING_BILL_DATE|billId|proposedDateYmd).',
      ],
      expectedImpact:
        'Apply writes only RecurringBill.nextDueDate; no money moves. The next forecast run will project the bill on the new date.',
    },
  };

  const attentionKind = `operational_action_shift_bill_${bill.id}`;
  const meta = buildOperationalAttentionMetadata(
    [{ type: 'OPEN_CASH_FLOW' }],
    {
      attentionKind,
      trust: {
        why: 'Drag-and-drop proposal pending your explicit approval.',
        whatChanged: `Recurring bill "${bill.name}" proposed to move to ${proposed.toISOString().slice(0, 10)}.`,
        recommendedNextStep:
          'Preview the deterministic forecast impact, then approve or dismiss — nothing has been written yet.',
        sourceEventType: 'OPERATIONAL_ACTION_PROPOSAL',
      },
    }
  ) as Record<string, unknown>;
  meta.operationalActionProposal = proposal;

  const notification = await createAutomationNotification({
    userId: session.user.id,
    type: AutomationNotificationType.AUTOMATION_ACTION,
    severity: NotificationSeverity.INFO,
    title: `Suggested action · Shift bill "${bill.name}"`,
    body: `Move "${bill.name}" from ${bill.nextDueDate.toISOString().slice(0, 10)} to ${proposed.toISOString().slice(0, 10)}. Apply step is user-approved and only touches nextDueDate.`,
    relatedEntityType: FinancialEntityType.RECURRING_BILL,
    relatedEntityId: bill.id,
    metadata: meta as unknown as Prisma.InputJsonValue,
  });

  return NextResponse.json({
    notificationId: notification.id,
    attentionKind,
    fingerprint,
  });
}
