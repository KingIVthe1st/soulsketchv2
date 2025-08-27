import Stripe from 'stripe';

// Stripe configuration
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
export const stripePublishableKey = process.env.STRIPE_PUBLISHABLE_KEY;

console.log('🔑 Stripe Configuration Check:', {
  secretKeyExists: !!stripeSecretKey,
  publishableKeyExists: !!stripePublishableKey,
  secretKeyFormat: stripeSecretKey ? stripeSecretKey.substring(0, 7) + '...' : 'missing',
  publishableKeyFormat: stripePublishableKey ? stripePublishableKey.substring(0, 7) + '...' : 'missing'
});

const stripe = stripeSecretKey ? new Stripe(stripeSecretKey, { apiVersion: '2024-06-20' }) : null;

const TIER_PRICES = {
  basic: 1999,     // $19.99 - Basic soulmate sketch + reading
  plus: 2999,      // $29.99 - Plus: includes location insights
  premium: 4999,   // $49.99 - Premium: includes full spiritual assessment
  demo: 0,         // Demo is free
};

export function getPriceCentsForTier(tier) {
  return TIER_PRICES[tier] ?? TIER_PRICES.basic;
}

export async function createPaymentIntent({ amount, currency = 'usd', metadata }) {
  if (!stripe) {
    // Demo fallback: simulate a succeeded intent
    return {
      id: `pi_demo_${Date.now()}`,
      client_secret: 'demo_secret',
      amount,
      currency,
      status: 'succeeded',
      metadata,
    };
  }
  
  return stripe.paymentIntents.create({
    amount,
    currency,
    // Enable automatic payment methods to allow Apple Pay
    automatic_payment_methods: {
      enabled: true
    },
    metadata,
    // Configuration for Apple Pay and other express checkout methods
    shipping: {
      name: metadata?.name || 'Customer',
      address: {
        line1: '123 Main Street',
        city: 'Any City',
        state: 'CA',
        postal_code: '90210',
        country: 'US',
      },
    },
    // Enable for digital goods (no physical shipping required) 
    ...(metadata?.email && typeof metadata.email === 'string' && metadata.email.trim() !== '' && { receipt_email: metadata.email.trim() }),
    description: `Soulmate Sketch ${metadata?.package || 'Package'} - AI-generated portrait and personalized reading`,
  });
}

export async function refundPaymentIntent(paymentIntentId) {
  if (!stripe) {
    return { id: `re_demo_${Date.now()}`, status: 'succeeded' };
  }
  return stripe.refunds.create({ payment_intent: paymentIntentId });
}
