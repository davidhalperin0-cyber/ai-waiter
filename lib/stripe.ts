import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('STRIPE_SECRET_KEY is not set. Stripe billing will not work until it is configured.');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  // Cast to any to avoid strict literal typing issues between Stripe SDK versions
  apiVersion: '2024-06-20' as any,
});





