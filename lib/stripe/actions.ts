import Stripe from 'stripe';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getURL } from '@/lib/utils';

const Plan = z.enum(['FREE', 'PRO', 'LIFETIME', 'ZEN_PLUS', 'COACHING_SESSION']);
const Cycle = z.enum(['monthly', 'annual']);

const checkoutSchema = z.object({
  email: z.string().email(),
  plan: Plan,
  cycle: Cycle.optional(),
  userId: z.string().cuid(),
  country: z.string().optional(),
  state: z.string().optional(),
});

const planPricing = {
  FREE: {
    monthly: {
      basePrice: 6.99,
      stripePriceId: process.env.STRIPE_PRICE_ID_STARTER_POST_TRIAL ?? '',
    },
    annual: {
      basePrice: 83.88,
      stripePriceId: process.env.STRIPE_PRICE_ID_STARTER_POST_TRIAL ?? '',
    },
    oneTime: { basePrice: 0, stripePriceId: '' },
  },
  PRO: {
    monthly: { basePrice: 14.99, stripePriceId: process.env.STRIPE_PRICE_ID_PRO_MONTHLY ?? '' },
    annual: { basePrice: 139, stripePriceId: process.env.STRIPE_PRICE_ID_PRO_YEARLY ?? '' },
    oneTime: { basePrice: 0, stripePriceId: '' },
  },
  LIFETIME: {
    monthly: { basePrice: 0, stripePriceId: '' },
    annual: { basePrice: 0, stripePriceId: '' },
    oneTime: { basePrice: 249, stripePriceId: process.env.STRIPE_PRICE_ID_LIFETIME ?? '' },
  },
  ZEN_PLUS: {
    monthly: { basePrice: 49, stripePriceId: process.env.STRIPE_PRICE_ID_ZEN_PLUS_MONTHLY ?? '' },
    annual: { basePrice: 499, stripePriceId: process.env.STRIPE_PRICE_ID_ZEN_PLUS_YEARLY ?? '' },
    oneTime: { basePrice: 0, stripePriceId: '' },
  },
  COACHING_SESSION: {
    monthly: { basePrice: 0, stripePriceId: '' },
    annual: { basePrice: 0, stripePriceId: '' },
    oneTime: { basePrice: 65, stripePriceId: process.env.STRIPE_PRICE_ID_COACHING_SESSION ?? '' },
  },
} as const;

const getTaxRate = (country?: string, state?: string): number => {
  if (!country) return 0;
  if (country === 'US') {
    const stateRates: Record<string, number> = {
      CA: 0.085,
      NY: 0.08,
      TX: 0.0625,
      FL: 0.06,
    };
    return stateRates[state || ''] || 0.07;
  }
  const countryRates: Record<string, number> = {
    CA: 0.13,
    GB: 0.2,
    AU: 0.1,
    DE: 0.19,
  };
  return countryRates[country] || 0;
};

function stripeClient(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY is not configured');
  }
  return new Stripe(key, { apiVersion: '2025-05-28.basil' });
}

export async function createCheckoutSession(input: z.infer<typeof checkoutSchema>) {
  const { email, plan, cycle, userId, country, state } = checkoutSchema.parse(input);
  const stripe = stripeClient();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { stripeCustomerId: true, subscriptionLevel: true },
  });

  if (!user) {
    throw new Error('User not found');
  }

  if (plan === 'ZEN_PLUS') {
    if (user.subscriptionLevel !== 'PRO' && user.subscriptionLevel !== 'LIFETIME') {
      throw new Error(
        'Zen+ Coaching is only available to Pro or Zen Access users. Please upgrade your plan first.'
      );
    }
  }

  let stripeCustomerId = user.stripeCustomerId;

  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      email,
      metadata: { userId },
    });
    stripeCustomerId = customer.id;

    await prisma.user.update({
      where: { id: userId },
      data: { stripeCustomerId },
    });
  }

  const isSubscription = plan === 'PRO' || plan === 'ZEN_PLUS';
  const pricing = planPricing[plan];
  const cycleKey: 'monthly' | 'annual' | 'oneTime' = isSubscription
    ? (cycle ?? 'monthly')
    : 'oneTime';
  const priceInfo = pricing[cycleKey];

  if (!priceInfo.stripePriceId) {
    throw new Error(`Price ID not found for plan ${plan} and cycle ${String(cycleKey)}`);
  }

  const taxRate = getTaxRate(country, state);
  const baseAmount = priceInfo.basePrice;
  const taxAmount = baseAmount * taxRate;
  const totalAmount = baseAmount + taxAmount;

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    billing_address_collection: 'required',
    customer: stripeCustomerId,
    line_items: [
      {
        price: priceInfo.stripePriceId,
        quantity: 1,
      },
    ],
    mode: isSubscription ? 'subscription' : 'payment',
    success_url: `${getURL()}dashboard?payment=success`,
    cancel_url: `${getURL()}pricing?payment=cancelled`,
    metadata: {
      userId,
      plan,
      cycle: cycle ?? '',
      baseAmount: baseAmount.toString(),
      taxRate: taxRate.toString(),
      taxAmount: taxAmount.toString(),
      totalAmount: totalAmount.toString(),
      country: country ?? '',
      state: state ?? '',
    },
    automatic_tax: { enabled: true },
    tax_id_collection: { enabled: true },
  });

  return session;
}

export function calculateTax(
  basePrice: number,
  country?: string,
  state?: string
): {
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
} {
  const taxRate = getTaxRate(country, state);
  const taxAmount = basePrice * taxRate;
  const totalAmount = basePrice + taxAmount;

  return {
    taxRate,
    taxAmount,
    totalAmount,
  };
}
