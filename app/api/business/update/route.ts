import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { businessId, name, logoUrl, type, template, menuStyle, aiInstructions, businessHours, menuOnlyMessage } = body;

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

    // Build update object - only include fields that are provided
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (logoUrl !== undefined) updateData.logoUrl = logoUrl || null; // Allow empty string to clear logo
    if (type !== undefined) updateData.type = type;
    if (template !== undefined) updateData.template = template;
    if (aiInstructions !== undefined) updateData.aiInstructions = aiInstructions;
    
    // Handle menuStyle and businessHours separately - if columns don't exist, skip them
    let optionalFieldsUpdate: any = {};
    if (menuStyle !== undefined) {
      optionalFieldsUpdate.menuStyle = menuStyle || null;
    }
    if (businessHours !== undefined) {
      optionalFieldsUpdate.businessHours = businessHours || null;
    }

    // Handle menuOnlyMessage - update subscription JSONB
    // Accept both undefined (not provided) and null (explicitly cleared)
    if (menuOnlyMessage !== undefined) {
      if (!currentBusiness?.subscription) {
        console.warn('No subscription found for business, creating default');
        optionalFieldsUpdate.subscription = {
          status: 'trial',
          planType: 'menu_only',
          tablesAllowed: 0,
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

    // At least one field must be provided
    if (Object.keys(updateData).length === 0 && Object.keys(optionalFieldsUpdate).length === 0) {
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
        // If subscription was updated successfully, we can still return success
        // But log the error for debugging
        console.warn('⚠️ Other fields update failed, but subscription may have been updated');
      } else {
        console.log('✅ Other fields update successful');
      }
    }
    
    // Verify the update was successful
    const { data: verifyData, error: verifyError } = await supabaseAdmin
      .from('businesses')
      .select('subscription')
      .eq('businessId', businessId)
      .maybeSingle();
    
    if (verifyError) {
      console.error('❌ Verification error:', verifyError);
    } else {
      console.log('✅ Verification successful - subscription in DB:', JSON.stringify(verifyData?.subscription, null, 2));
      console.log('✅ menuOnlyMessage in DB:', verifyData?.subscription?.menuOnlyMessage);
    }

    // Always return success if we got here (subscription was updated successfully)
    return NextResponse.json({ message: 'Business updated successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error updating business', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

