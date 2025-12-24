import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import Stripe from 'stripe';

// Disable body parsing - we need raw body for signature verification
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// POST /api/stripe/webhook
// Handles Stripe webhook events for subscription management
export async function POST(req: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not set');
    return NextResponse.json({ message: 'Webhook secret not configured' }, { status: 500 });
  }

  // Get raw body for signature verification
  let body: string;
  let signature: string | null;

  try {
    body = await req.text();
    signature = req.headers.get('stripe-signature');
  } catch (error) {
    console.error('Error reading webhook body', error);
    return NextResponse.json({ message: 'Invalid request body' }, { status: 400 });
  }

  if (!signature) {
    console.error('Missing stripe-signature header');
    return NextResponse.json({ message: 'Missing signature' }, { status: 400 });
  }

  // Verify Stripe signature
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed', err.message);
    return NextResponse.json({ message: 'Invalid signature' }, { status: 400 });
  }

  // Handle only the required events
  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      default:
        // Unknown event - return 200 to acknowledge receipt
        console.log(`Unhandled event type: ${event.type}`);
        return NextResponse.json({ received: true }, { status: 200 });
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error: any) {
    // Log error but return 200 to prevent Stripe retries
    console.error('Error processing webhook event', {
      type: event.type,
      error: error.message,
      stack: error.stack,
    });
    return NextResponse.json({ received: true, error: 'Processing failed' }, { status: 200 });
  }
}

// Handle checkout.session.completed
// Sets subscription to active and calculates next billing date
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  // Get businessId from metadata
  const businessId = session.metadata?.businessId || session.client_reference_id;

  if (!businessId) {
    console.error('No businessId found in checkout session', session.id);
    return;
  }

  // Get subscription ID from session
  const subscriptionId = typeof session.subscription === 'string' 
    ? session.subscription 
    : session.subscription?.id;

  // Update subscription metadata with businessId for future webhook events
  if (subscriptionId) {
    try {
      await stripe.subscriptions.update(subscriptionId, {
        metadata: {
          businessId: businessId,
        },
      });
    } catch (error: any) {
      // Log but don't fail - metadata update is optional
      console.warn('Failed to update subscription metadata', { subscriptionId, error: error.message });
    }
  }

  // Calculate next billing date (30 days from now)
  const nextBillingDate = new Date();
  nextBillingDate.setDate(nextBillingDate.getDate() + 30);
  const nextBillingDateISO = nextBillingDate.toISOString();

  // Get current subscription to preserve other fields
  const { data: business, error: fetchError } = await supabaseAdmin
    .from('businesses')
    .select('subscription')
    .eq('businessId', businessId)
    .maybeSingle();

  if (fetchError || !business) {
    console.error('Business not found for checkout session', { businessId, error: fetchError });
    return;
  }

  const currentSubscription = (business.subscription as any) || {};

  // Update only the subscription JSONB field
  const updatedSubscription = {
    ...currentSubscription,
    status: 'active' as const,
    nextBillingDate: nextBillingDateISO,
  };

  const { error: updateError } = await supabaseAdmin
    .from('businesses')
    .update({ subscription: updatedSubscription })
    .eq('businessId', businessId);

  if (updateError) {
    console.error('Error updating subscription after checkout', {
      businessId,
      error: updateError,
    });
    throw updateError;
  }

  console.log('Subscription activated', { businessId });
}

// Handle invoice.payment_failed
// Sets subscription status to past_due
// Use loose typing for invoice because Stripe typings may omit `subscription` on Invoice
async function handleInvoicePaymentFailed(invoice: any) {
  // Get subscription ID from invoice
  const subscriptionId = typeof invoice.subscription === 'string' 
    ? invoice.subscription 
    : invoice.subscription?.id;

  if (!subscriptionId) {
    console.error('No subscription ID found in invoice', invoice.id);
    return;
  }

  // Retrieve subscription to get metadata
  let subscription: Stripe.Subscription;
  try {
    subscription = await stripe.subscriptions.retrieve(subscriptionId);
  } catch (error: any) {
    console.error('Error retrieving subscription', { subscriptionId, error: error.message });
    return;
  }

  // Get businessId from subscription metadata
  const businessId = subscription.metadata?.businessId;

  if (!businessId) {
    console.error('No businessId found in subscription metadata', subscriptionId);
    return;
  }

  // Get current subscription to preserve other fields
  const { data: business, error: fetchError } = await supabaseAdmin
    .from('businesses')
    .select('subscription')
    .eq('businessId', businessId)
    .maybeSingle();

  if (fetchError || !business) {
    console.error('Business not found for payment failed', { businessId, error: fetchError });
    return;
  }

  const currentSubscription = (business.subscription as any) || {};

  // Update only the subscription JSONB field
  const updatedSubscription = {
    ...currentSubscription,
    status: 'past_due' as const,
  };

  const { error: updateError } = await supabaseAdmin
    .from('businesses')
    .update({ subscription: updatedSubscription })
    .eq('businessId', businessId);

  if (updateError) {
    console.error('Error updating subscription after payment failed', {
      businessId,
      error: updateError,
    });
    throw updateError;
  }

  console.log('Subscription marked as past_due', { businessId });
}

// Handle customer.subscription.deleted
// Sets subscription status to expired
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  // Get businessId from subscription metadata
  const businessId = subscription.metadata?.businessId;

  if (!businessId) {
    console.error('No businessId found in subscription metadata', subscription.id);
    return;
  }

  // Get current subscription to preserve other fields
  const { data: business, error: fetchError } = await supabaseAdmin
    .from('businesses')
    .select('subscription')
    .eq('businessId', businessId)
    .maybeSingle();

  if (fetchError || !business) {
    console.error('Business not found for subscription deleted', { businessId, error: fetchError });
    return;
  }

  const currentSubscription = (business.subscription as any) || {};

  // Update only the subscription JSONB field
  const updatedSubscription = {
    ...currentSubscription,
    status: 'expired' as const,
    nextBillingDate: null,
  };

  const { error: updateError } = await supabaseAdmin
    .from('businesses')
    .update({ subscription: updatedSubscription })
    .eq('businessId', businessId);

  if (updateError) {
    console.error('Error updating subscription after deletion', {
      businessId,
      error: updateError,
    });
    throw updateError;
  }

  console.log('Subscription marked as expired', { businessId });
}

