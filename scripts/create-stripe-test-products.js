const _Stripe = require('stripe');
require('dotenv').config();

const _stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const _products = [
  {
    name: 'Starter (Post-Trial)',
    description: 'Basic budgeting tools with 14-day free trial',
    price: 699, // $6.99 in cents
    currency: 'usd',
    type: 'one_time',
  },
  {
    name: 'Pro Monthly',
    description: 'Advanced features with monthly billing',
    price: 1499, // $14.99 in cents
    currency: 'usd',
    type: 'recurring',
    interval: 'month',
  },
  {
    name: 'Pro Annual',
    description: 'Advanced features with annual billing',
    price: 13900, // $139.00 in cents
    currency: 'usd',
    type: 'recurring',
    interval: 'year',
  },
  {
    name: 'Zen Access (Lifetime)',
    description: 'Lifetime access to all features',
    price: 24900, // $249.00 in cents
    currency: 'usd',
    type: 'one_time',
  },
  {
    name: 'Zen+ Coaching Monthly',
    description: 'Monthly coaching for Pro/Zen users',
    price: 4900, // $49.00 in cents
    currency: 'usd',
    type: 'recurring',
    interval: 'month',
  },
  {
    name: 'Zen+ Coaching Annual',
    description: 'Annual coaching for Pro/Zen users',
    price: 49900, // $499.00 in cents
    currency: 'usd',
    type: 'recurring',
    interval: 'year',
  },
  {
    name: '1-on-1 Coaching Session',
    description: 'Single coaching session',
    price: 6500, // $65.00 in cents
    currency: 'usd',
    type: 'one_time',
  },
];

async function createProducts() {
  console.log('Creating Stripe test products...\n');

  const _results = [];

  for (const product of products) {
    try {
      // Create the product
      const _stripeProduct = await stripe.products.create({
        name: product.name,
        description: product.description,
      });

      // Create the price
      const _priceData = {
        product: stripeProduct.id,
        unit_amount: product.price,
        currency: product.currency,
      };

      if (product.type === 'recurring') {
        priceData.recurring = {
          interval: product.interval,
        };
      }

      const _stripePrice = await stripe.prices.create(priceData);

      results.push({
        product: stripeProduct.name,
        priceId: stripePrice.id,
        amount: product.price / 100,
        type: product.type,
        interval: product.interval || 'one-time',
      });

      console.log(`✅ Created: ${product.name} - ${stripePrice.id}`);
    } catch (error) {
      console.error(`❌ Error creating ${product.name}:`, error.message);
    }
  }

  console.log('\n📋 Environment Variables to add to your .env file:');
  console.log('='.repeat(60));

  results.forEach(result => {
    const _envVar = result.product
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');

    console.log(`STRIPE_PRICE_ID_${envVar.toUpperCase()}="${result.priceId}"`);
  });

  console.log('\n🎉 Test products created successfully!');
  console.log('Copy the environment variables above to your .env file.');
}

createProducts().catch(console.error);
