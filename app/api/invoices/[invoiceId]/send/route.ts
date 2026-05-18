import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { isBrevoConfigured, sendTransactionalEmail } from '@/lib/email/send-email';
import { auditFinancialEvent } from '@/lib/security/financial-audit';
import { logSafeError } from '@/lib/security/safe-log';

export async function POST(
  _request: Request,
  context: { params: Promise<{ invoiceId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { invoiceId } = await context.params;
    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, userId: session.user.id },
      include: {
        lineItems: true,
        client: true,
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    const updatedInvoice = await prisma.invoice.update({
      where: { id: invoiceId, userId: session.user.id },
      data: { status: 'sent' },
    });

    await auditFinancialEvent({
      userId: session.user.id,
      action: 'invoice.sent',
      resource: invoice.id,
      details: { invoiceNumber: invoice.number, clientEmail: invoice.client.email },
    });

    const total =
      invoice.lineItems.length > 0
        ? invoice.lineItems.reduce((sum, item) => sum + item.amount, 0)
        : invoice.amount;

    if (process.env.NODE_ENV === 'production' && isBrevoConfigured() && invoice.client.email) {
      try {
        await sendTransactionalEmail({
          from: 'invoicing@stackzen.com',
          to: invoice.client.email,
          subject: `Invoice ${invoice.number} from StackZen`,
          html: `
            <h1>Invoice ${invoice.number}</h1>
            <p>Dear ${invoice.client.name},</p>
            <p>Your invoice total is ${formatCurrency(total)} and is due on ${new Date(invoice.dueDate).toLocaleDateString()}.</p>
            <p>Thank you for your business.</p>
          `,
        });
      } catch (mailError) {
        logSafeError('INVOICE_SEND_EMAIL', mailError);
      }
    }

    return NextResponse.json(updatedInvoice);
  } catch (error) {
    logSafeError('INVOICE_SEND', error);
    return NextResponse.json({ error: 'Failed to send invoice' }, { status: 500 });
  }
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}
