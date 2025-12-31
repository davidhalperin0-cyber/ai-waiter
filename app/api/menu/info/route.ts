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

    // Query using actual database column names: menustyle (lowercase) and customContent (camelCase)
    console.log('📋 menu/info - Fetching business:', businessId);
    
    const { data: business, error } = await supabaseAdmin
      .from('businesses')
      .select('businessId, name, name_en, logoUrl, template, menustyle, isEnabled, subscription, businessHours, customContent')
      .eq('businessId', businessId)
      .maybeSingle();

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
    
    // Map database column name (menustyle) to API response name (menuStyle)
    const menuStyle = business.menustyle || null;
    const customContent = business.customContent || null;
    
    console.log('📋 Subscription data:', {
      hasSubscription: !!subscription,
      planType: subscription?.planType,
      menuOnlyMessage: subscription?.menuOnlyMessage,
      subscriptionKeys: subscription ? Object.keys(subscription) : [],
      fullSubscription: subscription,
    });
    
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
          nameEn: business.name_en || undefined,
          logoUrl: business.logoUrl || null,
          template: business.template || 'generic',
          menuStyle: menuStyle,
          businessHours: business.businessHours || null,
          customContent: customContent,
          subscriptionStatus: 'expired',
          planType: subscription.planType || 'full',
          menuOnlyMessage: subscription.menuOnlyMessage || null,
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
          nameEn: business.name_en || undefined,
          logoUrl: business.logoUrl || null,
          template: business.template || 'generic',
          menuStyle: menuStyle,
          businessHours: business.businessHours || null,
          customContent: customContent,
          subscriptionStatus: 'expired',
          planType: subscription.planType || 'full',
          menuOnlyMessage: subscription.menuOnlyMessage || null,
        },
        { status: 403 },
      );
    }

    const response = {
      businessId: business.businessId,
      name: business.name,
      nameEn: business.name_en || undefined,
      logoUrl: business.logoUrl || null,
      template: business.template || 'generic',
      menuStyle: menuStyle,
      businessHours: business.businessHours || null,
      customContent: customContent,
      subscriptionStatus: 'active',
      planType: subscription.planType || 'full',
      menuOnlyMessage: subscription.menuOnlyMessage || null,
    };
    
    console.log('📋 Returning menu info:', {
      planType: response.planType,
      menuOnlyMessage: response.menuOnlyMessage,
      hasMessage: !!response.menuOnlyMessage,
      hasCustomContent: !!response.customContent,
      customContentType: typeof response.customContent,
      customContentKeys: response.customContent ? Object.keys(response.customContent) : [],
    });
    
    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Error fetching business info', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

