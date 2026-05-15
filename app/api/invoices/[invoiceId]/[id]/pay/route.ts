import { NextResponse } from 'next/server';
import { requireAuthSession } from '@/lib/api/require-auth';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';

export async function POST(
  _req: Request,
  context: { params: Promise<{ invoiceId: string; id: string }> }
) {
  const { session, response } = await requireAuthSession();
  if (response) return response;

  const params = await context.params;
  if (params.invoiceId !== params.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const invoice = await prisma.invoice.findFirst({
      where: { id: params.id, userId: session.user.id },
      include: { client: true },
    });

    if (!invoice) {
      return new NextResponse('Invoice not found', { status: 404 });
    }

    if (invoice.status === 'paid') {
      return new NextResponse('Invoice already paid', { status: 400 });
    }

    const stripeSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Invoice #${invoice.number}`,
              description: `Payment for invoice #${invoice.number}`,
            },
            unit_amount: Math.round(invoice.amount * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/invoices?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/invoices?canceled=true`,
      metadata: {
        invoiceId: invoice.id,
        jobId: invoice.jobId ?? '',
        quoteId: invoice.quoteId ?? '',
        userId: session.user.id,
      },
    });

    return NextResponse.json({ url: stripeSession.url });
  } catch (error) {
    console.error('[INVOICE_PAY]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}
