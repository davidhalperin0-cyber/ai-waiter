import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { isSubscriptionActive, shouldAutoExpire, Subscription } from '@/lib/subscription';

// GET /api/menu/info?businessId=...
// Returns business info including template for theme
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get('businessId');

    if (!businessId) {
      return NextResponse.json({ message: 'businessId is required' }, { status: 400 });
    }

    // Try to select with menuStyle and businessHours, fallback if column doesn't exist
    let { data: business, error } = await supabaseAdmin
      .from('businesses')
      .select('businessId, name, logoUrl, template, menuStyle, isEnabled, subscription, businessHours')
      .eq('businessId', businessId)
      .maybeSingle();

    // If optional columns (menuStyle, businessHours) don't exist yet, try without them
    if (error && (error.message?.includes('menuStyle') || error.message?.includes('businessHours'))) {
      console.warn('Optional columns may not exist yet, retrying without them:', error.message);
      const retry = await supabaseAdmin
        .from('businesses')
        .select('businessId, name, logoUrl, template, isEnabled, subscription')
        .eq('businessId', businessId)
        .maybeSingle();
      business = retry.data;
      error = retry.error;
    }

    if (error) {
      console.error('Error fetching business info', error);
      return NextResponse.json({ message: 'Database error' }, { status: 500 });
    }

    if (!business) {
      return NextResponse.json({ message: 'Business not found' }, { status: 404 });
    }

    // Check if business is enabled
    if (!business.isEnabled) {
      return NextResponse.json(
        { message: 'Business is disabled', subscriptionStatus: 'disabled' },
        { status: 403 },
      );
    }

    // Check subscription status
    const subscription = business.subscription as Subscription;
    
    // Auto-expire safety net: if status is "active" but nextBillingDate is in the past
    if (shouldAutoExpire(subscription)) {
      // Update subscription to expired
      await supabaseAdmin
        .from('businesses')
        .update({
          subscription: {
            ...subscription,
            status: 'expired',
          },
        })
        .eq('businessId', business.businessId);
      
      console.log(`Auto-expired subscription for business ${business.businessId} - nextBillingDate passed`);
      
      return NextResponse.json(
        {
          businessId: business.businessId,
          name: business.name,
          logoUrl: business.logoUrl || null,
          template: business.template || 'generic',
          menuStyle: business.menuStyle || null,
          businessHours: business.businessHours || null,
          subscriptionStatus: 'expired',
        },
        { status: 403 },
      );
    }
    
    // Check if subscription is active
    if (!isSubscriptionActive(subscription)) {
      return NextResponse.json(
        {
          businessId: business.businessId,
          name: business.name,
          logoUrl: business.logoUrl || null,
          template: business.template || 'generic',
          menuStyle: business.menuStyle || null,
          businessHours: business.businessHours || null,
          subscriptionStatus: 'expired',
        },
        { status: 403 },
      );
    }

    return NextResponse.json(
      {
        businessId: business.businessId,
        name: business.name,
        logoUrl: business.logoUrl || null,
        template: business.template || 'generic',
        menuStyle: business.menuStyle || null,
        businessHours: business.businessHours || null,
        subscriptionStatus: 'active',
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('Error fetching business info', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

