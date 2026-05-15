import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { notFoundInProduction } from '@/lib/api/production-gate';

export async function GET() {
  const blocked = notFoundInProduction();
  if (blocked) return blocked;

  try {
    const priceIds = [
      process.env.STRIPE_PRICE_ID_FREE_MONTHLY,
      process.env.STRIPE_PRICE_ID_FREE_YEARLY,
      process.env.STRIPE_PRICE_ID_PRO_MONTHLY,
      process.env.STRIPE_PRICE_ID_PRO_YEARLY,
      process.env.STRIPE_PRICE_ID_LIFETIME,
      process.env.STRIPE_PRICE_ID_ZEN_PLUS_MONTHLY,
      process.env.STRIPE_PRICE_ID_ZEN_PLUS_YEARLY,
      process.env.STRIPE_PRICE_ID_COACHING_SESSION,
    ];

    const validationResults = [];

    for (const priceId of priceIds) {
      if (!priceId) {
        validationResults.push({
          priceId: 'NOT_SET',
          status: 'MISSING',
          error: 'Price ID not configured in environment variables',
        });
        continue;
      }

      try {
        const price = await stripe.prices.retrieve(priceId);
        validationResults.push({
          priceId,
          status: 'VALID',
          price: {
            id: price.id,
            unit_amount: price.unit_amount,
            currency: price.currency,
            recurring: price.recurring,
            product: price.product,
          },
        });
      } catch (error) {
        validationResults.push({
          priceId,
          status: 'INVALID',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    const summary = {
      total: priceIds.length,
      valid: validationResults.filter(r => r.status === 'VALID').length,
      missing: validationResults.filter(r => r.status === 'MISSING').length,
      invalid: validationResults.filter(r => r.status === 'INVALID').length,
    };

    return NextResponse.json({
      success: true,
      summary,
      results: validationResults,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
