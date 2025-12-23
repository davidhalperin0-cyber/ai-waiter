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
    let { data: business, error } = await supabaseAdmin
      .from('businesses')
      .select('businessId, name, logoUrl, type, template, menuStyle, email, isEnabled, subscription, printerConfig, posConfig, aiInstructions, businessHours')
      .eq('businessId', businessId)
      .maybeSingle();

    // If error suggests missing column, try without problematic columns
    if (error && error.message?.includes('column')) {
      console.warn('Column may not exist, retrying with fallback:', error.message);
      
      // Try without optional columns (menuStyle, businessHours)
      if (error.message?.includes('menuStyle') || error.message?.includes('businessHours')) {
        const retry = await supabaseAdmin
          .from('businesses')
          .select('businessId, name, logoUrl, type, template, email, isEnabled, subscription, printerConfig, posConfig, aiInstructions')
          .eq('businessId', businessId)
          .maybeSingle();
        business = retry.data;
        error = retry.error;
      }
      
      // If still error and it's about type, try without type
      if (error && error.message?.includes('type')) {
        const retry2 = await supabaseAdmin
          .from('businesses')
          .select('businessId, name, template, email, isEnabled, subscription, printerConfig, posConfig, aiInstructions')
          .eq('businessId', businessId)
          .maybeSingle();
        business = retry2.data;
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
      subscription: business.subscription || { status: 'trial', tablesAllowed: 10 },
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

