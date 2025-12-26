import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get('businessId');

    if (!businessId) {
      return NextResponse.json({ message: 'businessId is required' }, { status: 400 });
    }

    // Try to select all columns - handle missing columns gracefully
    // Use loose typing here because Supabase returns dynamic shapes depending on selected columns
    let { data: business, error }: { data: any; error: any } = await supabaseAdmin
      .from('businesses')
      .select('businessId, name, logoUrl, type, template, menuStyle, email, isEnabled, subscription, printerConfig, posConfig, aiInstructions, businessHours, customContent')
      .eq('businessId', businessId)
      .maybeSingle();

    // If error suggests missing column, try without problematic columns or with lowercase
    if (error && error.message?.includes('column')) {
      console.warn('Column may not exist, retrying with fallback:', error.message);
      
      // Try with lowercase customcontent if customContent failed
      if (error.message?.includes('customContent') || error.message?.includes('customcontent')) {
        console.warn('Trying lowercase customcontent column');
        const retryLowercase = await supabaseAdmin
          .from('businesses')
          .select('businessId, name, logoUrl, type, template, menuStyle, email, isEnabled, subscription, printerConfig, posConfig, aiInstructions, businessHours, customcontent')
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
          // Try without optional columns (menuStyle, businessHours, customContent)
          const retry = await supabaseAdmin
            .from('businesses')
            .select(
              'businessId, name, logoUrl, type, template, email, isEnabled, subscription, printerConfig, posConfig, aiInstructions',
            )
            .eq('businessId', businessId)
            .maybeSingle();

          // Ensure the fallback result still has optional keys
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
      } else if (error.message?.includes('menuStyle') || error.message?.includes('businessHours')) {
        // Try without menuStyle and businessHours, but keep customContent
        const retry = await supabaseAdmin
          .from('businesses')
          .select(
            'businessId, name, logoUrl, type, template, email, isEnabled, subscription, printerConfig, posConfig, aiInstructions, customContent',
          )
          .eq('businessId', businessId)
          .maybeSingle();

        // If that fails, try with lowercase customcontent
        if (retry.error && retry.error.message?.includes('customContent')) {
          const retryLowercase = await supabaseAdmin
            .from('businesses')
            .select(
              'businessId, name, logoUrl, type, template, email, isEnabled, subscription, printerConfig, posConfig, aiInstructions, customcontent',
            )
            .eq('businessId', businessId)
            .maybeSingle();
          
          if (!retryLowercase.error && retryLowercase.data) {
            business = {
              ...retryLowercase.data,
              menuStyle: null,
              businessHours: null,
              customContent: retryLowercase.data.customcontent || null,
            };
            delete business.customcontent;
            error = null;
          } else {
            // Final fallback - without all optional columns
            const finalRetry = await supabaseAdmin
              .from('businesses')
              .select(
                'businessId, name, logoUrl, type, template, email, isEnabled, subscription, printerConfig, posConfig, aiInstructions',
              )
              .eq('businessId', businessId)
              .maybeSingle();
            
            business = finalRetry.data
              ? {
                  ...finalRetry.data,
                  menuStyle: null,
                  businessHours: null,
                  customContent: null,
                }
              : null;
            error = finalRetry.error;
          }
        } else {
          // Ensure the fallback result still has optional keys
          business = retry.data
            ? {
                ...retry.data,
                menuStyle: null,
                businessHours: null,
                customContent: retry.data.customContent || null,
              }
            : null;
          error = retry.error;
        }
      }

      // If still error and it's about type, try without type
      if (error && error.message?.includes('type')) {
        const retry2 = await supabaseAdmin
          .from('businesses')
          .select('businessId, name, template, email, isEnabled, subscription, printerConfig, posConfig, aiInstructions')
          .eq('businessId', businessId)
          .maybeSingle();

        business = retry2.data
          ? {
              ...retry2.data,
              // Preserve possible values from previous fallback if they exist
              menuStyle: (business as any)?.menuStyle ?? null,
              businessHours: (business as any)?.businessHours ?? null,
              customContent: (business as any)?.customContent ?? null,
            }
          : null;
        error = retry2.error;
      }
    }

    if (error) {
      console.error('Error fetching business info:', error);
      return NextResponse.json(
        { message: 'Database error', details: error.message },
        { status: 500 },
      );
    }

    if (!business) {
      return NextResponse.json({ message: 'Business not found' }, { status: 404 });
    }

    // Ensure all expected fields exist with defaults
    const businessData = {
      businessId: business.businessId,
      name: business.name,
      type: business.type || business.template || 'generic',
      template: business.template || 'generic',
      menuStyle: business.menuStyle || null,
      email: business.email,
      isEnabled: business.isEnabled ?? true,
      subscription: business.subscription || { status: 'trial' },
      printerConfig: business.printerConfig || {
        enabled: false,
        type: 'http',
        endpoint: '',
        payloadType: 'json',
      },
      posConfig: business.posConfig || {
        enabled: false,
        provider: 'generic',
        endpoint: '',
        method: 'POST',
        headers: {},
        timeoutMs: 5000,
      },
      aiInstructions: business.aiInstructions || null,
      businessHours: business.businessHours || null,
      customContent: business.customContent || business.customcontent || null, // Try both camelCase and lowercase
    };

    return NextResponse.json({ business: businessData }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching business info:', error);
    return NextResponse.json(
      {
        message: 'Internal server error',
        details: error?.message || String(error),
      },
      { status: 500 },
    );
  }
}

