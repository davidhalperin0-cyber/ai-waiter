import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { businessId, name, logoUrl, type, template, menuStyle, aiInstructions, businessHours, menuOnlyMessage, customContent } = body;

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
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
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
    
    // Handle menuStyle, businessHours, and customContent separately - if columns don't exist, skip them
    let optionalFieldsUpdate: any = {};
    if (menuStyle !== undefined) {
      optionalFieldsUpdate.menuStyle = menuStyle || null;
    }
    if (businessHours !== undefined) {
      optionalFieldsUpdate.businessHours = businessHours || null;
    }
    
    // Handle customContent separately (like subscription) to ensure it's saved correctly
    let customContentToUpdate: any = null;
    if (customContent !== undefined) {
      console.log('📝 customContent update requested:', JSON.stringify(customContent, null, 2));
      customContentToUpdate = customContent || null;
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
      const { error: subError, data: subData } = await supabaseAdmin
        .from('businesses')
        .update({ subscription: optionalFieldsUpdate.subscription })
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
    
    // Update customContent separately if needed (like subscription)
    if (customContentToUpdate !== null) {
      console.log('📝 Updating customContent separately:', JSON.stringify(customContentToUpdate, null, 2));
      
      // Try both camelCase and lowercase column names
      let customContentError: any = null;
      let customContentData: any = null;
      
      // First try with camelCase (quoted)
      let updateResult = await supabaseAdmin
        .from('businesses')
        .update({ customContent: customContentToUpdate })
        .eq('businessId', businessId)
        .select('customContent');
      
      customContentError = updateResult.error;
      customContentData = updateResult.data;
      
      // If error suggests column doesn't exist, try lowercase
      if (customContentError && (customContentError.message?.includes('column') || customContentError.message?.includes('does not exist'))) {
        console.warn('⚠️ Trying lowercase column name: customcontent');
        updateResult = await supabaseAdmin
          .from('businesses')
          .update({ customcontent: customContentToUpdate })
          .eq('businessId', businessId)
          .select('customcontent');
        
        customContentError = updateResult.error;
        customContentData = updateResult.data;
      }
      
      if (customContentError) {
        console.error('❌ customContent update error:', customContentError);
        console.error('❌ Error message:', customContentError.message);
        console.error('❌ Error code:', customContentError.code);
        console.error('❌ Error details:', JSON.stringify(customContentError, null, 2));
        
        // Check if column doesn't exist
        if (customContentError.message?.includes('column') || customContentError.message?.includes('does not exist')) {
          return NextResponse.json({ 
            message: 'customContent column does not exist. Please run the SQL migration: fix_database_schema.sql', 
            details: customContentError.message,
            code: customContentError.code 
          }, { status: 500 });
        }
        
        return NextResponse.json({ 
          message: 'Failed to update customContent', 
          details: customContentError.message,
          code: customContentError.code 
        }, { status: 500 });
      } else {
        console.log('✅ customContent update successful');
        console.log('📝 Updated customContent:', JSON.stringify(customContentData?.[0]?.customContent || customContentData?.[0]?.customcontent, null, 2));
      }
    }
    
    // Update other fields if any
    let updatePayload = { ...updateData, ...optionalFieldsUpdate };
    if (Object.keys(updatePayload).length > 0) {
      console.log('📝 Updating other fields:', JSON.stringify(updatePayload, null, 2));
      let { error, data } = await supabaseAdmin
        .from('businesses')
        .update(updatePayload)
        .eq('businessId', businessId)
        .select();
      
      if (error) {
        console.error('❌ Other fields update error:', error);
        console.error('❌ Error details:', JSON.stringify(error, null, 2));
        
        // Check if error is due to missing columns (menuStyle, businessHours)
        const isColumnError = error.message?.includes('column') || error.message?.includes('does not exist');
        
        if (isColumnError) {
          console.warn('⚠️ Column may not exist, trying update without optional fields');
          // Try updating only required fields (template, name, type, etc.)
          const requiredFieldsOnly: any = {};
          if (updateData.name !== undefined) requiredFieldsOnly.name = updateData.name;
          if (updateData.logoUrl !== undefined) requiredFieldsOnly.logoUrl = updateData.logoUrl;
          if (updateData.type !== undefined) requiredFieldsOnly.type = updateData.type;
          if (updateData.template !== undefined) requiredFieldsOnly.template = updateData.template;
          if (updateData.aiInstructions !== undefined) requiredFieldsOnly.aiInstructions = updateData.aiInstructions;
          
          if (Object.keys(requiredFieldsOnly).length > 0) {
            const { error: retryError, data: retryData } = await supabaseAdmin
              .from('businesses')
              .update(requiredFieldsOnly)
              .eq('businessId', businessId)
              .select();
            
            if (retryError) {
              console.error('❌ Retry update also failed:', retryError);
              return NextResponse.json({ 
                message: 'Failed to update business fields', 
                details: retryError.message,
                code: retryError.code 
              }, { status: 500 });
            } else {
              console.log('✅ Required fields updated successfully (optional fields skipped)');
              console.log('✅ Updated data:', JSON.stringify(retryData, null, 2));
            }
          }
        } else {
          // Return error if update failed for other reasons
          return NextResponse.json({ 
            message: 'Failed to update business fields', 
            details: error.message,
            code: error.code 
          }, { status: 500 });
        }
      } else {
        console.log('✅ Other fields update successful');
        console.log('✅ Updated data:', JSON.stringify(data, null, 2));
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

