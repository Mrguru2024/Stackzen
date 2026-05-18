import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { findOwnedFirst } from '@/lib/db/owned';
import { z } from 'zod';
import { recomputeJobRevenue } from '@/lib/jobs/revenue';
import { createFinancialEventSafe } from '@/lib/financial-events/events';
import {
  FinancialEntityType,
  FinancialEventSource,
  FinancialEventType,
  type Invoice,
} from '@prisma/client';
import { auditFinancialEvent } from '@/lib/security/financial-audit';
import { logSafeError } from '@/lib/security/safe-log';

type Ctx = { params: Promise<{ invoiceId: string }> };

export async function GET(_request: Request, context: Ctx) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { invoiceId } = await context.params;

    const invoice = await findOwnedFirst(
      prisma.invoice,
      invoiceId,
      session.user.id,
      { include: { lineItems: true, client: true } }
    );

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    return NextResponse.json(invoice);
  } catch (error) {
    logSafeError('INVOICE_GET', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: Ctx) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { invoiceId } = await context.params;
    const existing = await findOwnedFirst<Invoice>(prisma.invoice, invoiceId, session.user.id);

    if (!existing) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    const patchSchema = z
      .object({
        status: z.enum(['draft', 'pending', 'paid', 'failed']).optional(),
        notes: z.string().max(3000).optional(),
        amount: z.number().nonnegative().finite().optional(),
        cost: z.number().nonnegative().finite().optional(),
        invoiceType: z.enum(['standard', 'deposit', 'final']).optional(),
      })
      .strict();
    const parsed = patchSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const { status, notes, amount, cost, invoiceType } = parsed.data;
    const nextAmount = typeof amount === 'number' ? amount : existing.amount;
    const nextCost = typeof cost === 'number' ? cost : existing.cost;
    const nextProfit = typeof nextCost === 'number' ? nextAmount - nextCost : null;

    const invoice = await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        ...(status !== undefined ? { status } : {}),
        ...(notes !== undefined ? { notes } : {}),
        ...(amount !== undefined ? { amount } : {}),
        ...(cost !== undefined ? { cost } : {}),
        ...(invoiceType !== undefined ? { invoiceType } : {}),
        profit: nextProfit,
      },
      include: { lineItems: true, client: true },
    });

    if (invoice.jobId) {
      await recomputeJobRevenue(invoice.jobId, session.user.id);
    }

    await createFinancialEventSafe({
      userId: session.user.id,
      type:
        status !== undefined
          ? FinancialEventType.INVOICE_STATUS_CHANGED
          : FinancialEventType.INVOICE_UPDATED,
      source: FinancialEventSource.API_INVOICES,
      amount: invoice.amount,
      relatedEntityType: FinancialEntityType.INVOICE,
      relatedEntityId: invoice.id,
      metadata: {
        invoiceId: invoice.id,
        invoiceNumber: invoice.number,
        status: invoice.status,
        invoiceType: invoice.invoiceType,
        previousStatus: existing.status,
      },
    });

    await auditFinancialEvent({
      userId: session.user.id,
      action: 'invoice.updated',
      resource: invoice.id,
      details: { status: invoice.status, amount: invoice.amount },
    });

    return NextResponse.json(invoice);
  } catch (error) {
    logSafeError('INVOICE_PATCH', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: Ctx) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { invoiceId } = await context.params;
    const existing = await findOwnedFirst<Invoice>(prisma.invoice, invoiceId, session.user.id);

    if (!existing) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    await prisma.invoice.delete({ where: { id: invoiceId, userId: session.user.id } });

    await auditFinancialEvent({
      userId: session.user.id,
      action: 'invoice.deleted',
      resource: invoiceId,
      details: { invoiceNumber: existing.number },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    logSafeError('INVOICE_DELETE', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
