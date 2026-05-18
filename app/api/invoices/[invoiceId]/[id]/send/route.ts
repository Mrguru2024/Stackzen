import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import type { Invoice } from '@prisma/client';
import { findOwnedFirst } from '@/lib/db/owned';
import { isBrevoConfigured, sendTransactionalEmail } from '@/lib/email/send-email';
import { auditFinancialEvent } from '@/lib/security/financial-audit';
import { logSafeError } from '@/lib/security/safe-log';

export async function POST(
  _request: Request,
  context: { params: Promise<{ invoiceId: string; id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await context.params;
    if (params.invoiceId !== params.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const invoice = await findOwnedFirst<
      Invoice & {
        lineItems: { amount: number; description: string; quantity: number; unitPrice: number }[];
        client: { name: string; email: string | null };
      }
    >(prisma.invoice, params.id, session.user.id, {
      include: { lineItems: true, client: true },
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    const invoiceId = params.id;
    const row = invoice as typeof invoice & {
      id: string;
      lineItems: { amount: number; description: string; quantity: number; unitPrice: number }[];
      client: { name: string; email: string | null };
      number: string;
      amount: number;
      dueDate: Date;
    };

    const updatedInvoice = await prisma.invoice.update({
      where: { id: invoiceId, userId: session.user.id },
      data: { status: 'sent' },
    });

    await auditFinancialEvent({
      userId: session.user.id,
      action: 'invoice.sent',
      resource: invoiceId,
      details: { invoiceNumber: row.number },
    });

    const lineTotal = row.lineItems.reduce((sum, li) => sum + li.amount, 0);
    const total = lineTotal > 0 ? lineTotal : row.amount;
    const clientEmail = row.client.email;

    if (process.env.NODE_ENV === 'production' && isBrevoConfigured() && clientEmail) {
      try {
        await sendTransactionalEmail({
          from: 'invoicing@stackzen.com',
          to: clientEmail,
          subject: `Invoice ${row.number} from StackZen`,
          html: `<p>Invoice ${row.number} for ${formatCurrency(total)} — due ${new Date(row.dueDate).toLocaleDateString()}.</p>`,
        });
      } catch (error) {
        logSafeError('INVOICE_SEND_EMAIL', error);
      }
    }

    return NextResponse.json(updatedInvoice);
  } catch (error) {
    logSafeError('INVOICE_SEND', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}
