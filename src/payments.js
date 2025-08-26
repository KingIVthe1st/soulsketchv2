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
    automatic_payment_methods: { enabled: true },
    metadata,
  });
}

export async function refundPaymentIntent(paymentIntentId) {
  if (!stripe) {
    return { id: `re_demo_${Date.now()}`, status: 'succeeded' };
  }
  return stripe.refunds.create({ payment_intent: paymentIntentId });
}
