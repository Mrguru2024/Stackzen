import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function POST(
  _request: Request,
  context: { params: Promise<{ invoiceId: string; id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await context.params;
    if (params.invoiceId !== params.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const id = params.id;

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        lineItems: true,
        client: true,
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    if (invoice.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const updatedInvoice = await prisma.invoice.update({
      where: { id },
      data: { status: 'sent' },
    });

    const lineTotal = invoice.lineItems.reduce((sum, li) => sum + li.amount, 0);
    const total = lineTotal > 0 ? lineTotal : invoice.amount;
    const clientEmail = invoice.client.email;

    if (process.env.NODE_ENV === 'production' && resend && clientEmail) {
      try {
        await resend.emails.send({
          from: 'invoicing@stackzen.com',
          to: clientEmail,
          subject: `Invoice ${invoice.number} from StackZen`,
          html: `
            <h1>Invoice ${invoice.number}</h1>
            <p>Dear ${invoice.client.name},</p>
            <p>Please find attached your invoice for ${formatCurrency(total)}.</p>
            <p>Due date: ${new Date(invoice.dueDate).toLocaleDateString()}</p>
            <h2>Line Items:</h2>
            <table>
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Quantity</th>
                  <th>Unit Price</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                ${invoice.lineItems
                  .map(
                    item => `
                  <tr>
                    <td>${item.description}</td>
                    <td>${item.quantity}</td>
                    <td>${formatCurrency(item.unitPrice)}</td>
                    <td>${formatCurrency(item.amount)}</td>
                  </tr>
                `
                  )
                  .join('')}
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="3">Total</td>
                  <td>${formatCurrency(total)}</td>
                </tr>
              </tfoot>
            </table>
            <p>Thank you for your business!</p>
          `,
        });
      } catch (error) {
        console.error('Failed to send email:', error);
      }
    }

    return NextResponse.json(updatedInvoice);
  } catch (error) {
    console.error('Failed to send invoice:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}
