import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { recomputeJobRevenue } from '@/lib/jobs/revenue';
import { createFinancialEventSafe } from '@/lib/financial-events/events';
import {
  FinancialEntityType,
  FinancialEventSource,
  FinancialEventType,
} from '@prisma/client';

const lineItemSchema = z
  .object({
    description: z.string().min(1),
    quantity: z.number().int().positive(),
    unitPrice: z.number().nonnegative().finite(),
  })
  .strict();

const createInvoiceSchema = z
  .object({
    clientId: z.string().cuid(),
    dueDate: z.string().datetime(),
    lineItems: z.array(lineItemSchema).min(1),
    notes: z.string().max(3000).optional(),
    quoteId: z.string().cuid().optional(),
    jobId: z.string().cuid().optional(),
    cost: z.number().nonnegative().finite().optional(),
    invoiceType: z.enum(['standard', 'deposit', 'final']).optional(),
  })
  .strict();

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const parsed = createInvoiceSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const { clientId, dueDate, lineItems, notes, quoteId, cost, jobId, invoiceType } = parsed.data;
    const total = lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const profit = typeof cost === 'number' ? total - cost : null;

    const [client, quote, job] = await Promise.all([
      prisma.client.findFirst({
        where: { id: clientId, userId: session.user.id },
        select: { id: true },
      }),
      quoteId
        ? prisma.quote.findFirst({
            where: { id: quoteId, userId: session.user.id },
            select: { id: true, jobId: true },
          })
        : Promise.resolve(null),
      jobId
        ? prisma.job.findFirst({
            where: { id: jobId, userId: session.user.id },
            select: { id: true, clientId: true },
          })
        : Promise.resolve(null),
    ]);

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }
    if (quoteId && !quote) {
      return NextResponse.json({ error: 'Invalid quoteId for this user' }, { status: 400 });
    }
    if (jobId && !job) {
      return NextResponse.json({ error: 'Invalid jobId for this user' }, { status: 400 });
    }
    if (job && job.clientId !== clientId) {
      return NextResponse.json({ error: 'jobId/clientId mismatch' }, { status: 400 });
    }

    // Generate invoice number
    const lastInvoice = await prisma.invoice.findFirst({
      orderBy: { createdAt: 'desc' },
    });
    const invoiceNumber = lastInvoice
      ? `INV-${Number.parseInt(lastInvoice.number.split('-')[1], 10) + 1}`
      : 'INV-1001';

    const invoice = await prisma.invoice.create({
      data: {
        number: invoiceNumber,
        clientId,
        userId: session.user.id,
        jobId: jobId ?? quote?.jobId ?? null,
        quoteId,
        dueDate: new Date(dueDate),
        amount: total,
        cost: cost ?? null,
        profit,
        invoiceType: invoiceType ?? 'standard',
        status: 'pending',
        notes,
        lineItems: {
          create: lineItems.map(item => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            amount: item.quantity * item.unitPrice,
          })),
        },
      },
      include: {
        client: true,
        lineItems: true,
      },
    });

    if (invoice.jobId) {
      await recomputeJobRevenue(invoice.jobId, session.user.id);
    }

    await createFinancialEventSafe({
      userId: session.user.id,
      type: FinancialEventType.INVOICE_CREATED,
      source: FinancialEventSource.API_INVOICES,
      amount: invoice.amount,
      relatedEntityType: FinancialEntityType.INVOICE,
      relatedEntityId: invoice.id,
      metadata: {
        invoiceId: invoice.id,
        invoiceNumber: invoice.number,
        clientId: invoice.clientId,
        jobId: invoice.jobId,
        quoteId: invoice.quoteId,
        status: invoice.status,
        invoiceType: invoice.invoiceType,
      },
    });

    return NextResponse.json(invoice);
  } catch (error) {
    console.error('[INVOICE_CREATE]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}

export async function GET(_request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const invoices = await prisma.invoice.findMany({
      where: { userId: session.user.id },
      include: {
        client: true,
        lineItems: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Calculate summary data
    const summary = {
      totalInvoices: invoices.length,
      totalPaid: invoices.filter(invoice => invoice.status === 'paid').length,
      totalOverdue: invoices.filter(invoice => invoice.status === 'overdue').length,
      totalDraft: invoices.filter(invoice => invoice.status === 'draft').length,
      totalAmount: invoices.reduce((sum, invoice) => sum + invoice.amount, 0),
      paidAmount: invoices
        .filter(invoice => invoice.status === 'paid')
        .reduce((sum, invoice) => sum + invoice.amount, 0),
      overdueAmount: invoices
        .filter(invoice => invoice.status === 'overdue')
        .reduce((sum, invoice) => sum + invoice.amount, 0),
      draftAmount: invoices
        .filter(invoice => invoice.status === 'draft')
        .reduce((sum, invoice) => sum + invoice.amount, 0),
    };

    return NextResponse.json({
      invoices,
      summary,
      pagination: {
        total: invoices.length,
        pages: Math.ceil(invoices.length / 10),
        page: 1,
        limit: 10,
      },
    });
  } catch (error) {
    console.error('[INVOICES_GET]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}
