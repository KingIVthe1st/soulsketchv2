import Stripe from 'stripe';
const stripeKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeKey ? new Stripe(stripeKey, { apiVersion: '2024-06-20' }) : null;

const TIER_PRICES = {
  basic: 1900,
  premium: 3900,
  deluxe: 6900,
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
