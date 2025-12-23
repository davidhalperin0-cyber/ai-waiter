import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

// POST /api/billing/create-checkout-session
// Body: { businessId: string, tablesRequested: number }
export async function POST(req: NextRequest) {
  try {
    if (!process.env.STRIPE_PRICE_PER_TABLE_ID) {
      console.error('STRIPE_PRICE_PER_TABLE_ID is not set');
      return NextResponse.json(
        { message: 'Billing is not configured yet. Please contact support.' },
        { status: 500 },
      );
    }

    const body = await req.json();
    const { businessId, tablesRequested } = body as {
      businessId?: string;
      tablesRequested?: number;
    };

    if (!businessId || !tablesRequested || tablesRequested <= 0) {
      return NextResponse.json(
        { message: 'businessId and a positive tablesRequested are required' },
        { status: 400 },
      );
    }

    // Fetch business email/name for Stripe customer
    const { data: business, error } = await supabaseAdmin
      .from('businesses')
      .select('businessId, email, name, subscription')
      .eq('businessId', businessId)
      .maybeSingle();

    if (error || !business) {
      console.error('Error fetching business for billing', error);
      return NextResponse.json({ message: 'Business not found' }, { status: 404 });
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXT_PUBLIC_VERCEL_URL ||
      'http://localhost:3000';

    // Create Stripe Checkout Session for subscription
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer_email: business.email,
      client_reference_id: business.businessId, // Fallback for webhook identification
      line_items: [
        {
          price: process.env.STRIPE_PRICE_PER_TABLE_ID!,
          quantity: tablesRequested,
        },
      ],
      success_url: `${baseUrl}/dashboard?billing=success`,
      cancel_url: `${baseUrl}/dashboard?billing=canceled`,
      metadata: {
        businessId: business.businessId,
        tablesRequested: String(tablesRequested),
      },
    });

    return NextResponse.json({ url: session.url }, { status: 200 });
  } catch (error: any) {
    console.error('Error creating Stripe checkout session', error);
    return NextResponse.json(
      { message: 'Failed to create checkout session', details: error?.message || String(error) },
      { status: 500 },
    );
  }
}



