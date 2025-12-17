import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  // @ts-ignore - Stripe types might lag behind API version strings
  apiVersion: '2025-01-27.acacia',
  typescript: true,
});
