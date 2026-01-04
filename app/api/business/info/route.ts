export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get('businessId');

    if (!businessId) {
      return NextResponse.json({ message: 'businessId is required' }, { status: 400 });
    }

    // Simplified: Single query without aggressive retries
    // localStorage handles read replica lag on the frontend
    // This makes the API much faster (no 22 second delays)
    // Try to select all columns - handle missing columns gracefully
    // Use actual DB column name: menustyle (lowercase)
    // Use loose typing here because Supabase returns dynamic shapes depending on selected columns
    // IMPORTANT: Do NOT select legacy contact columns (phone, whatsapp, instagram, facebook) - customContent.contact is the source of truth
    // Only select business.email (the business email, not contact email)
    const result = await supabaseAdmin
      .from('businesses')
      .select('businessId, name, name_en, logoUrl, type, template, menustyle, email, isEnabled, subscription, printerConfig, posConfig, aiInstructions, businessHours, customContent, debug_last_writer')
      .eq('businessId', businessId)
      .maybeSingle();
    
    let business: any = result.data;
    let error: any = result.error;
    
    // Log raw data from DB to see what we're getting
    if (business) {
      const rawInstagram = business.customContent?.contact?.instagram || business.customcontent?.contact?.instagram;
      const rawPhone = business.customContent?.contact?.phone || business.customcontent?.contact?.phone;
      const rawWhatsapp = business.customContent?.contact?.whatsapp || business.customcontent?.contact?.whatsapp;
      const rawEmail = business.customContent?.contact?.email || business.customcontent?.contact?.email;
      const rawFacebook = business.customContent?.contact?.facebook || business.customcontent?.contact?.facebook;
      console.log('📥 API: Raw business data from DB:', {
        hasCustomContent: !!business.customContent,
        hasCustomcontent: !!business.customcontent,
        customContentType: typeof business.customContent,
        contact: business.customContent?.contact || business.customcontent?.contact,
        phone: rawPhone,
        phoneLength: rawPhone?.length,
        whatsapp: rawWhatsapp,
        whatsappLength: rawWhatsapp?.length,
        email: rawEmail,
        emailLength: rawEmail?.length,
        instagram: rawInstagram,
        instagramLength: rawInstagram?.length,
        instagramBytes: rawInstagram ? new TextEncoder().encode(rawInstagram).length : 0,
        facebook: rawFacebook,
        facebookLength: rawFacebook?.length,
        // Log the full JSON to see if it's truncated
        customContentJson: JSON.stringify(business.customContent || business.customcontent).substring(0, 2000),
      });
    }

    // If error suggests missing column, try without problematic columns or with lowercase
    if (error && error.message?.includes('column')) {
      console.warn('Column may not exist, retrying with fallback:', error.message);
      
      // Try with lowercase customcontent if customContent failed
      if (error.message?.includes('customContent') || error.message?.includes('customcontent')) {
        console.warn('Trying lowercase customcontent column');
        const retryLowercase = await supabaseAdmin
          .from('businesses')
          .select('businessId, name, name_en, logoUrl, type, template, menustyle, email, isEnabled, subscription, printerConfig, posConfig, aiInstructions, businessHours, customcontent')
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
                menustyle: null,
                businessHours: null,
                customContent: null,
              }
            : null;
          error = retry.error;
        }
      } else if (error.message?.includes('menustyle') || error.message?.includes('menuStyle') || error.message?.includes('businessHours')) {
        // Try without menustyle and businessHours, but keep customContent
        const retry = await supabaseAdmin
          .from('businesses')
          .select(
            'businessId, name, name_en, logoUrl, type, template, email, isEnabled, subscription, printerConfig, posConfig, aiInstructions, customContent',
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
              menustyle: null,
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
                'businessId, name, name_en, logoUrl, type, template, email, isEnabled, subscription, printerConfig, posConfig, aiInstructions',
              )
              .eq('businessId', businessId)
              .maybeSingle();
            
            business = finalRetry.data
              ? {
                  ...finalRetry.data,
                  menustyle: null,
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
                menustyle: null,
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
              menustyle: (business as any)?.menustyle ?? (business as any)?.menuStyle ?? null,
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
    // Map database column name (menustyle) to API response name (menuStyle)
    const menuStyle = business.menustyle || null;
    
    const businessData = {
      businessId: business.businessId,
      name: business.name,
      nameEn: business.name_en || undefined,
      type: business.type || business.template || 'generic',
      template: business.template || 'generic',
      menuStyle: menuStyle,
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
      customContent: (() => {
        // Use the RPC result if available (it's already set in business.customContent above)
        const content = business.customContent || business.customcontent || null;
        if (!content) return null;
        
        // CRITICAL: customContent.contact is the SINGLE SOURCE OF TRUTH
        // Do NOT merge with legacy business columns (phone, email, whatsapp, instagram, facebook)
        // Use customContent.contact exactly as-is if it exists
        // Legacy columns are fallback ONLY if customContent.contact is completely missing
        
        const cleaned = {
          ...content,
          contact: content.contact 
            ? {
                // Use customContent.contact EXACTLY as-is - NO merging, NO overriding
                enabled: content.contact.enabled ?? false,
                phone: content.contact.phone ?? '',
                email: content.contact.email ?? '',
                whatsapp: content.contact.whatsapp ?? '',
                instagram: content.contact.instagram ?? '',
                facebook: content.contact.facebook ?? '',
              }
            : // Fallback ONLY if customContent.contact doesn't exist
              // Note: Legacy columns (phone, whatsapp, instagram, facebook) are NOT selected in the query above
              // So this fallback will only work if they exist in the database and Supabase returns them anyway
              // But customContent.contact should always exist, so this fallback should rarely be used
              undefined,
          loyaltyClub: content.loyaltyClub ? {
            enabled: content.loyaltyClub.enabled ?? false,
          } : undefined,
        };
        
        console.log('📥 API: Cleaned customContent (customContent.contact is source of truth):', {
          contact: cleaned.contact,
          phone: cleaned.contact?.phone,
          whatsapp: cleaned.contact?.whatsapp,
          email: cleaned.contact?.email,
          instagram: cleaned.contact?.instagram,
          facebook: cleaned.contact?.facebook,
          usingFallback: !content.contact && !!cleaned.contact,
        });
        
        return cleaned;
      })(),
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

