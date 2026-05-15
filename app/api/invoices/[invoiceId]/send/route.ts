import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

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
      where: { id: invoiceId },
      data: { status: 'sent' },
    });

    const total =
      invoice.lineItems.length > 0
        ? invoice.lineItems.reduce((sum, item) => sum + item.amount, 0)
        : invoice.amount;

    if (process.env.NODE_ENV === 'production' && resend && invoice.client.email) {
      try {
        await resend.emails.send({
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
        console.error('[INVOICE_SEND_EMAIL]', mailError);
      }
    }

    return NextResponse.json(updatedInvoice);
  } catch (error) {
    console.error('[INVOICE_SEND]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}
