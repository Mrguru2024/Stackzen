import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuthSession } from '@/lib/api/require-auth';
import { prisma } from '@/lib/prisma';
import { getStripe } from '@/lib/stripe/client';

const bodySchema = z
  .object({
    amount: z.number().positive().finite(),
    contractorId: z.string().cuid(),
    invoiceId: z.string().cuid(),
  })
  .strict();

/**
 * Direct PaymentIntent creation against a contractor's connected account
 * (used by the marketplace flow that pays a contractor via the platform).
 *
 * For the standard "Get Paid" flow on a StackZen invoice, prefer
 * `POST /api/invoices/[invoiceId]/payment-link`.
 */
export async function POST(req: Request) {
  const { session, response } = await requireAuthSession();
  if (response) return response;

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
  const { amount, contractorId, invoiceId } = parsed.data;

  const contractor = await prisma.user.findUnique({
    where: { id: contractorId },
    select: { stripeAccountId: true, stripeChargesEnabled: true },
  });
  if (!contractor?.stripeAccountId || !contractor.stripeChargesEnabled) {
    return NextResponse.json(
      { error: 'Contractor has not finished connecting Stripe yet' },
      { status: 400 }
    );
  }

  const platformFee = Math.round(amount * 0.018);
  const paymentIntent = await getStripe().paymentIntents.create({
    amount,
    currency: 'usd',
    application_fee_amount: platformFee,
    transfer_data: { destination: contractor.stripeAccountId },
    metadata: {
      invoiceId,
      contractorId,
      buyerId: session.user.id,
    },
  });

  await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      status: 'pending',
      stripePaymentIntentId: paymentIntent.id,
    },
  });

  return NextResponse.json({ clientSecret: paymentIntent.client_secret });
}
