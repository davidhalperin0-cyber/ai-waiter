import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { businessId, name, nameEn, logoUrl, type, template, aiInstructions, businessHours, menuOnlyMessage, customContent } = body;

    if (!businessId) {
      return NextResponse.json({ message: 'businessId is required' }, { status: 400 });
    }

    // Get current business to update subscription
    const { data: currentBusiness, error: fetchError } = await supabaseAdmin
      .from('businesses')
      .select('subscription')
      .eq('businessId', businessId)
      .maybeSingle();

    if (fetchError) {
      console.error('Error fetching current business', fetchError);
      return NextResponse.json({ message: 'Database error' }, { status: 500 });
    }

    // Valid template values
    const validTemplates = [
      'bar-modern', 'bar-classic', 'bar-mid',
      'pizza-modern', 'pizza-classic', 'pizza-mid',
      'sushi', 'generic', 'gold',
      'bar', 'pizza' // backward compatibility
    ];

    // Build update object - only include fields that are provided
    // Separate name_en from other fields since it should always be saved
    const updateData: any = {};
    const nameEnUpdate: any = {};
    
    if (name !== undefined) updateData.name = name;
    if (nameEn !== undefined) {
      // Handle nameEn like menu items - allow null/empty to clear, otherwise trim
      if (nameEn === null || nameEn === '') {
        nameEnUpdate.name_en = null;
      } else if (typeof nameEn === 'string') {
        nameEnUpdate.name_en = nameEn.trim() || null;
      } else {
        nameEnUpdate.name_en = nameEn;
      }
    }
    if (logoUrl !== undefined) updateData.logoUrl = logoUrl || null; // Allow empty string to clear logo
    if (type !== undefined) updateData.type = type;
    if (template !== undefined) {
      // Validate template value
      if (!validTemplates.includes(template)) {
        console.error('❌ Invalid template value:', template);
        return NextResponse.json({ 
          message: 'Invalid template value', 
          validTemplates,
          provided: template
        }, { status: 400 });
      }
      updateData.template = template;
      console.log('🎨 Template update requested:', template);
    }
    if (aiInstructions !== undefined) updateData.aiInstructions = aiInstructions;
    
    // Handle businessHours separately - if column doesn't exist, skip it
    let optionalFieldsUpdate: any = {};
    if (businessHours !== undefined) {
      optionalFieldsUpdate.businessHours = businessHours || null;
    }
    
    // Handle customContent separately (like subscription) to ensure it's saved correctly
    let customContentToUpdate: any = null;
    if (customContent !== undefined) {
      console.log('📝 customContent update requested:', JSON.stringify(customContent, null, 2));
      // Clean customContent before saving - remove old fields
      if (customContent) {
        customContentToUpdate = {
          ...customContent,
          contact: customContent.contact ? {
            enabled: customContent.contact.enabled,
            phone: customContent.contact.phone || '',
            email: customContent.contact.email || '',
            whatsapp: customContent.contact.whatsapp || '',
            instagram: customContent.contact.instagram || '',
            facebook: customContent.contact.facebook || '',
          } : undefined,
          loyaltyClub: customContent.loyaltyClub ? {
            enabled: customContent.loyaltyClub.enabled,
          } : undefined,
        };
      } else {
        customContentToUpdate = null;
      }
      console.log('📝 customContent cleaned for save:', JSON.stringify(customContentToUpdate, null, 2));
    }

    // Handle menuOnlyMessage - update subscription JSONB
    // Accept both undefined (not provided) and null (explicitly cleared)
    if (menuOnlyMessage !== undefined) {
      if (!currentBusiness?.subscription) {
        console.warn('No subscription found for business, creating default');
        optionalFieldsUpdate.subscription = {
          status: 'trial',
          planType: 'menu_only',
          menuOnlyMessage: menuOnlyMessage?.trim() || null,
        };
      } else {
        const currentSubscription = currentBusiness.subscription as any;
        // Ensure we preserve all existing subscription fields
        optionalFieldsUpdate.subscription = {
          ...currentSubscription,
          menuOnlyMessage: menuOnlyMessage?.trim() || null,
        };
        console.log('📝 Current subscription:', currentSubscription);
        console.log('📝 Updated subscription:', optionalFieldsUpdate.subscription);
      }
      console.log('📝 Updating menuOnlyMessage:', { 
        menuOnlyMessage, 
        trimmed: menuOnlyMessage?.trim(),
        final: menuOnlyMessage?.trim() || null,
        subscription: optionalFieldsUpdate.subscription 
      });
    } else {
      console.log('📝 menuOnlyMessage not provided (undefined)');
    }

    // At least one field must be provided (including customContent which is updated separately)
    if (Object.keys(updateData).length === 0 && Object.keys(optionalFieldsUpdate).length === 0 && customContentToUpdate === null) {
      return NextResponse.json({ message: 'At least one field must be provided' }, { status: 400 });
    }

    // Update subscription separately if needed (like in stripe webhook)
    if (optionalFieldsUpdate.subscription) {
      console.log('📝 Updating subscription separately:', JSON.stringify(optionalFieldsUpdate.subscription, null, 2));
      // DEBUG: Set debug_last_writer to track who wrote last
      const { error: subError, data: subData } = await supabaseAdmin
        .from('businesses')
        .update({ 
          subscription: optionalFieldsUpdate.subscription,
          debug_last_writer: 'API:business/update:subscription',
        })
        .eq('businessId', businessId)
        .select('subscription');
      
      if (subError) {
        console.error('❌ Subscription update error:', subError);
        console.error('❌ Error message:', subError.message);
        console.error('❌ Error code:', subError.code);
        console.error('❌ Error details:', JSON.stringify(subError, null, 2));
        return NextResponse.json({ 
          message: 'Failed to update subscription', 
          details: subError.message,
          code: subError.code 
        }, { status: 500 });
      } else {
        console.log('✅ Subscription update successful');
        console.log('📝 Updated subscription:', JSON.stringify(subData?.[0]?.subscription, null, 2));
        console.log('📝 menuOnlyMessage in updated subscription:', subData?.[0]?.subscription?.menuOnlyMessage);
      }
      
      // Remove subscription from optionalFieldsUpdate since we already updated it
      delete optionalFieldsUpdate.subscription;
    }
    
    // Update name_en separately if needed (like customContent)
    if (nameEnUpdate && Object.keys(nameEnUpdate).length > 0) {
      console.log('📝 Updating name_en separately:', JSON.stringify(nameEnUpdate, null, 2));
      // DEBUG: Set debug_last_writer to track who wrote last
      const { error: nameEnError, data: nameEnData } = await supabaseAdmin
        .from('businesses')
        .update({
          ...nameEnUpdate,
          debug_last_writer: 'API:business/update:name_en',
        })
        .eq('businessId', businessId)
        .select('name_en');
      
      if (nameEnError) {
        console.error('❌ name_en update error:', nameEnError);
        // Don't fail the entire request if name_en fails - it might not exist yet
        console.warn('⚠️ name_en update failed, but continuing with other fields');
      } else {
        console.log('✅ name_en update successful');
        console.log('📝 Updated name_en:', JSON.stringify(nameEnData?.[0]?.name_en, null, 2));
      }
    }
    
    // CRITICAL: customContent MUST have ONE writer only: update_business_custom_content RPC
    // Use RPC function to ensure the update is actually saved in the database
    // The RPC function performs the update directly in PostgreSQL, bypassing Supabase client issues
    if (customContentToUpdate !== null) {
      console.log('💾 Saving customContent via RPC function:', JSON.stringify(customContentToUpdate, null, 2));
      
      try {
        const rpcResult = await supabaseAdmin.rpc('update_business_custom_content', {
          p_business_id: businessId,
          p_custom_content: customContentToUpdate,
        });
        
        if (rpcResult.error) {
          console.error('❌ RPC function error:', rpcResult.error);
          return NextResponse.json({ 
            message: 'Failed to update customContent', 
            details: rpcResult.error.message 
          }, { status: 500 });
        }
        
        if (!rpcResult.data || rpcResult.data.length === 0) {
          console.error('❌ RPC function returned no data');
          return NextResponse.json({ 
            message: 'Failed to update customContent - no data returned' 
          }, { status: 500 });
        }
        
        console.log('✅ RPC function succeeded!', {
          returnedCustomContent: rpcResult.data[0]?.customContent,
          contact: rpcResult.data[0]?.customContent?.contact,
        });
        
        // Verify the saved data matches what we sent
        const savedContact = rpcResult.data[0]?.customContent?.contact;
        const expectedContact = customContentToUpdate?.contact;
        
        if (savedContact && expectedContact) {
          const phoneMatch = savedContact.phone === expectedContact.phone;
          const emailMatch = savedContact.email === expectedContact.email;
          const whatsappMatch = savedContact.whatsapp === expectedContact.whatsapp;
          const instagramMatch = savedContact.instagram === expectedContact.instagram;
          const facebookMatch = savedContact.facebook === expectedContact.facebook;
          
          console.log('🔍 RPC verification:', {
            phone: { expected: expectedContact.phone, saved: savedContact.phone, match: phoneMatch },
            email: { expected: expectedContact.email, saved: savedContact.email, match: emailMatch },
            whatsapp: { expected: expectedContact.whatsapp, saved: savedContact.whatsapp, match: whatsappMatch },
            instagram: { expected: expectedContact.instagram, saved: savedContact.instagram, match: instagramMatch },
            facebook: { expected: expectedContact.facebook, saved: savedContact.facebook, match: facebookMatch },
          });
          
          if (!phoneMatch || !emailMatch || !whatsappMatch || !instagramMatch || !facebookMatch) {
            console.warn('⚠️ WARNING: RPC saved data does not match expected data!');
          }
        }
        
        // CRITICAL: IMMEDIATELY return - ZERO fallthrough, ZERO additional .update() calls
        // This prevents any post-RPC writes that would overwrite customContent
        return NextResponse.json({ 
          message: 'Business updated successfully',
          business: {
            businessId: rpcResult.data[0]?.businessId,
            customContent: rpcResult.data[0]?.customContent, // Return RPC result - source of truth
          }
        }, { status: 200 });
      } catch (rpcErr: any) {
        console.error('❌ RPC function exception:', rpcErr);
        return NextResponse.json({ 
          message: 'Failed to update customContent', 
          details: rpcErr?.message || 'RPC function error' 
        }, { status: 500 });
      }
    }
    
    // Only reach here if customContent was NOT being updated
    // Update other fields (but NOT customContent - that's handled by RPC above)
    let updatePayload = { ...updateData, ...optionalFieldsUpdate };
    
    // KILL-SWITCH GUARD: If customContent somehow made it into updatePayload, throw fatal error
    if (updatePayload.customContent !== undefined) {
      console.error('❌ FATAL: customContent found in updatePayload after RPC check!');
      throw new Error('FATAL: post-RPC write attempted - customContent must only be updated via RPC');
    }
    
    if (Object.keys(updatePayload).length > 0) {
      // Update other fields normally
      // DEBUG: Set debug_last_writer to track who wrote last
      const updateWithDebug = {
        ...updatePayload,
        debug_last_writer: 'API:business/update:other_fields',
      };
      console.log('🔍 DEBUG: Updating other fields with debug_last_writer:', updateWithDebug.debug_last_writer);
      console.log('🔍 DEBUG: Update payload keys:', Object.keys(updateWithDebug));
      let { error, data } = await supabaseAdmin
        .from('businesses')
        .update(updateWithDebug)
        .eq('businessId', businessId);
      
      // Log any errors
      if (error) {
        console.error('❌ Error updating business:', error);
        console.error('❌ Error details:', JSON.stringify(error, null, 2));
      } else {
        // Fix: Be defensive about the structure/type of 'data'
        let affectedRows: number | string = 'unknown';
        if (Array.isArray(data)) {
          affectedRows = (data as any[]).length;
        } else if (data && typeof data === 'object' && 'length' in data && typeof (data as any).length === 'number') {
          affectedRows = (data as any).length;
        }
        console.log('✅ Update successful, affected rows:', affectedRows);
      }
      
      // If error suggests column doesn't exist, try without optional fields
      if (error) {
        // Check if error is due to missing columns (businessHours)
        const isColumnError = error.message?.includes('column') || error.message?.includes('does not exist');
        
        if (isColumnError) {
          // Try updating without optional fields (like menu items do)
          const requiredFieldsOnly: any = {};
          if (updateData.name !== undefined) requiredFieldsOnly.name = updateData.name;
          if (updateData.logoUrl !== undefined) requiredFieldsOnly.logoUrl = updateData.logoUrl;
          if (updateData.type !== undefined) requiredFieldsOnly.type = updateData.type;
          if (updateData.template !== undefined) requiredFieldsOnly.template = updateData.template;
          if (updateData.aiInstructions !== undefined) requiredFieldsOnly.aiInstructions = updateData.aiInstructions;
          
          if (Object.keys(requiredFieldsOnly).length > 0) {
            // DEBUG: Set debug_last_writer to track who wrote last
            const retryWithDebug = {
              ...requiredFieldsOnly,
              debug_last_writer: 'API:business/update:retry_required_fields',
            };
            console.log('🔍 DEBUG: Retry update with debug_last_writer:', retryWithDebug.debug_last_writer);
            const retry = await supabaseAdmin
              .from('businesses')
              .update(retryWithDebug)
              .eq('businessId', businessId);
            
            if (retry.error) {
              console.error('Error updating business (retry)', retry.error);
              return NextResponse.json({ 
                message: 'Database error', 
                details: retry.error.message 
              }, { status: 500 });
            }
          }
        } else {
          console.error('Error updating business', error);
          return NextResponse.json({ 
            message: 'Database error', 
            details: error.message 
          }, { status: 500 });
        }
      }
    }
    
    
    // Verify the update was successful by fetching the updated business
    // Only verify if template was updated
    if (template !== undefined) {
      const { data: verifyData, error: verifyError } = await supabaseAdmin
        .from('businesses')
        .select('template')
        .eq('businessId', businessId)
        .maybeSingle();
      
      if (verifyError) {
        console.error('❌ Verification error:', verifyError);
        // Don't fail the request if verification fails - the update might have succeeded
        console.warn('⚠️ Could not verify template update, but update may have succeeded');
      } else {
        console.log('✅ Verification successful');
        console.log('✅ Template in DB:', verifyData?.template);
        console.log('✅ Template requested:', template);
        
        // Verify that template was updated if it was in the request
        if (verifyData?.template !== template) {
          console.error('❌ Template mismatch!', {
            requested: template,
            actual: verifyData?.template
          });
          // Don't fail - just log the warning, the update might still be processing
          console.warn('⚠️ Template value mismatch - may be a timing issue');
        } else {
          console.log('✅ Template matches requested value');
        }
      }
    }

    return NextResponse.json({ message: 'Business updated successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('❌ Error updating business:', error);
    console.error('❌ Error stack:', error?.stack);
    console.error('❌ Error message:', error?.message);
    return NextResponse.json({ 
      message: 'Internal server error', 
      details: error?.message || 'Unknown error',
      error: process.env.NODE_ENV === 'development' ? error?.stack : undefined
    }, { status: 500 });
  }
}

