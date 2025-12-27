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

    // Try to select with menuStyle, businessHours, and customContent, fallback if column doesn't exist
    // Use loose typing because selected columns can change in fallbacks
    console.log('📋 menu/info - Fetching business:', businessId);
    
    // First, try to get ALL columns to see what exists
    const { data: allBusinessData, error: allError } = await supabaseAdmin
      .from('businesses')
      .select('*')
      .eq('businessId', businessId)
      .maybeSingle();
    
    console.log('📋 menu/info - ALL COLUMNS query result:', {
      hasData: !!allBusinessData,
      hasError: !!allError,
      error: allError?.message,
      allKeys: allBusinessData ? Object.keys(allBusinessData) : [],
      hasCustomContent: 'customContent' in (allBusinessData || {}),
      hasCustomcontent: 'customcontent' in (allBusinessData || {}),
      customContentValue: allBusinessData?.customContent,
      customcontentValue: allBusinessData?.customcontent,
    });
    
    let { data: business, error }: { data: any; error: any } = await supabaseAdmin
      .from('businesses')
      .select('businessId, name, logoUrl, template, menuStyle, isEnabled, subscription, businessHours, customContent')
      .eq('businessId', businessId)
      .maybeSingle();
    
    console.log('📋 menu/info - Initial query result:', {
      hasData: !!business,
      hasError: !!error,
      error: error?.message,
      hasCustomContent: !!business?.customContent,
      hasCustomcontent: !!business?.customcontent,
      businessKeys: business ? Object.keys(business) : [],
    });
    
    // If initial query failed but allBusinessData exists, use it
    if (error && allBusinessData && !allError) {
      console.log('📋 menu/info - Using allBusinessData as fallback');
      business = allBusinessData;
      error = null;
    }

    // If optional columns don't exist yet, try with lowercase or without them
    if (error && (error.message?.includes('menuStyle') || error.message?.includes('businessHours') || error.message?.includes('customContent'))) {
      console.warn('Optional columns may not exist yet, retrying with lowercase customcontent:', error.message);
      
      // Try with lowercase customcontent
      if (error.message?.includes('customContent') || error.message?.includes('customcontent')) {
        const retryLowercase = await supabaseAdmin
          .from('businesses')
          .select('businessId, name, logoUrl, template, menuStyle, isEnabled, subscription, businessHours, customcontent')
          .eq('businessId', businessId)
          .maybeSingle();
        
        if (!retryLowercase.error && retryLowercase.data) {
          // Map customcontent to customContent
          business = {
            ...retryLowercase.data,
            customContent: retryLowercase.data.customcontent || null,
          };
          delete business.customcontent; // Remove lowercase version
          error = null;
        } else {
          // Try without optional columns
          console.warn('Trying without optional columns');
          const retry = await supabaseAdmin
            .from('businesses')
            .select('businessId, name, logoUrl, template, isEnabled, subscription')
            .eq('businessId', businessId)
            .maybeSingle();

          // Ensure we still have optional keys for typing
          business = retry.data
            ? {
                ...retry.data,
                menuStyle: null,
                businessHours: null,
                customContent: null,
              }
            : null;
          error = retry.error;
        }
      } else {
        // Try without optional columns
        const retry = await supabaseAdmin
          .from('businesses')
          .select('businessId, name, logoUrl, template, isEnabled, subscription')
          .eq('businessId', businessId)
          .maybeSingle();

        // Ensure we still have optional keys for typing
        business = retry.data
          ? {
              ...retry.data,
              menuStyle: null,
              businessHours: null,
              customContent: null,
            }
          : null;
        error = retry.error;
      }
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
          logoUrl: business.logoUrl || null,
          template: business.template || 'generic',
          menuStyle: business.menuStyle || null,
          businessHours: business.businessHours || null,
          customContent: business.customContent || null,
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
          logoUrl: business.logoUrl || null,
          template: business.template || 'generic',
          menuStyle: business.menuStyle || null,
          businessHours: business.businessHours || null,
          customContent: business.customContent || null,
          subscriptionStatus: 'expired',
          planType: subscription.planType || 'full',
          menuOnlyMessage: subscription.menuOnlyMessage || null,
        },
        { status: 403 },
      );
    }

    // Try to get customContent from both camelCase and lowercase
    // Also check allBusinessData if available (from the * query)
    let customContent = business.customContent || business.customcontent || allBusinessData?.customContent || allBusinessData?.customcontent || null;
    
    console.log('📋 menu/info - Raw business data:', {
      hasCustomContent: !!business.customContent,
      hasCustomcontent: !!business.customcontent,
      customContentType: typeof business.customContent,
      customcontentType: typeof business.customcontent,
      customContentValue: business.customContent,
      customcontentValue: business.customcontent,
    });
    
    // If customContent is still null, try to fetch it directly with both column names
    if (!customContent) {
      console.warn('📋 menu/info - customContent is null, trying direct queries');
      
      // Try camelCase first
      const { data: directData1, error: directError1 } = await supabaseAdmin
        .from('businesses')
        .select('customContent')
        .eq('businessId', businessId)
        .maybeSingle();
      
      console.log('📋 menu/info - Direct query (camelCase) result:', {
        hasData: !!directData1,
        hasError: !!directError1,
        error: directError1?.message,
        hasCustomContent: !!directData1?.customContent,
        customContent: directData1?.customContent,
      });
      
      if (directData1?.customContent) {
        customContent = directData1.customContent;
        console.log('✅ Found customContent via camelCase direct query');
      } else {
        // Try lowercase
        const { data: directData2, error: directError2 } = await supabaseAdmin
          .from('businesses')
          .select('customcontent')
          .eq('businessId', businessId)
          .maybeSingle();
        
        console.log('📋 menu/info - Direct query (lowercase) result:', {
          hasData: !!directData2,
          hasError: !!directError2,
          error: directError2?.message,
          hasCustomcontent: !!directData2?.customcontent,
          customcontent: directData2?.customcontent,
        });
        
        if (directData2?.customcontent) {
          customContent = directData2.customcontent;
          console.log('✅ Found customContent via lowercase direct query');
        } else {
          // Try selecting all columns to see what exists
          const { data: allColumns, error: allError } = await supabaseAdmin
            .from('businesses')
            .select('*')
            .eq('businessId', businessId)
            .maybeSingle();
          
          if (allColumns && !allError) {
            console.log('📋 menu/info - All columns keys:', Object.keys(allColumns));
            console.log('📋 menu/info - Has customContent key:', 'customContent' in allColumns);
            console.log('📋 menu/info - Has customcontent key:', 'customcontent' in allColumns);
            console.log('📋 menu/info - customContent value:', allColumns.customContent);
            console.log('📋 menu/info - customcontent value:', allColumns.customcontent);
            
            // Try to get from allColumns
            if (allColumns.customContent) {
              customContent = allColumns.customContent;
              console.log('✅ Found customContent from allColumns (camelCase)');
            } else if (allColumns.customcontent) {
              customContent = allColumns.customcontent;
              console.log('✅ Found customContent from allColumns (lowercase)');
            }
          }
        }
      }
    }

    const response = {
      businessId: business.businessId,
      name: business.name,
      logoUrl: business.logoUrl || null,
      template: business.template || 'generic',
      menuStyle: business.menuStyle || null,
      businessHours: business.businessHours || null,
      customContent: customContent,
      subscriptionStatus: 'active',
      planType: subscription.planType || 'full', // Include planType in response
      menuOnlyMessage: subscription.menuOnlyMessage || null, // Custom message for menu-only plan
    };
    
    console.log('📋 Returning menu info:', {
      planType: response.planType,
      menuOnlyMessage: response.menuOnlyMessage,
      hasMessage: !!response.menuOnlyMessage,
      hasCustomContent: !!response.customContent,
      customContentType: typeof response.customContent,
      customContentKeys: response.customContent ? Object.keys(response.customContent) : [],
      customContentString: JSON.stringify(response.customContent),
      
    });
    
    // Final check - if customContent is still null, log detailed warning
    if (!response.customContent) {
      console.error('❌❌❌ WARNING: customContent is NULL in final response!');
      console.error('❌ Business data keys:', business ? Object.keys(business) : 'no business');
      console.error('❌ All business data keys:', allBusinessData ? Object.keys(allBusinessData) : 'no allBusinessData');
      console.error('❌ Business customContent:', business?.customContent);
      console.error('❌ Business customcontent:', business?.customcontent);
      console.error('❌ AllBusinessData customContent:', allBusinessData?.customContent);
      console.error('❌ AllBusinessData customcontent:', allBusinessData?.customcontent);
    } else {
      console.log('✅✅✅ SUCCESS: customContent found and included in response!');
      console.log('✅ customContent keys:', Object.keys(response.customContent));
    }
    
    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Error fetching business info', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

