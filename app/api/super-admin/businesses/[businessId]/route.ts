export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { isSuperAdmin } from '@/lib/superAdminAuth';

// PUT /api/super-admin/businesses/[businessId]
// Update business (enable/disable, subscription, etc.)
export async function PUT(
  req: NextRequest,
  { params }: { params: { businessId: string } },
) {
  try {
    // Check super admin authentication
    // Try multiple ways to get the token (cookies, headers)
    let token = req.cookies.get('auth')?.value;
    
    // Fallback: check Authorization header
    if (!token) {
      const authHeader = req.headers.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }
    
    if (!token) {
      console.error('No auth token found in cookies or headers');
      console.error('Available cookies:', Array.from(req.cookies.getAll()).map(c => c.name));
      return NextResponse.json({ message: 'Unauthorized - No authentication token' }, { status: 403 });
    }
    
    const isAdmin = await isSuperAdmin(token);
    if (!isAdmin) {
      console.error('Super admin check failed for token:', token.substring(0, 20) + '...');
      // Try to verify the token to see what's in it
      const { verifyAuthToken } = await import('@/lib/auth');
      const payload = await verifyAuthToken(token);
      console.error('Token payload:', payload);
      console.error('SUPER_ADMIN_EMAIL from env:', process.env.SUPER_ADMIN_EMAIL ? 'SET' : 'NOT SET');
      return NextResponse.json({ 
        message: 'Unauthorized - Super admin access required',
        debug: process.env.NODE_ENV === 'development' ? {
          hasToken: !!token,
          tokenPreview: token.substring(0, 20),
          payload: payload,
          expectedEmail: process.env.SUPER_ADMIN_EMAIL
        } : undefined
      }, { status: 403 });
    }

    const businessId = params.businessId;
    const body = await req.json();
    const { isEnabled, subscription } = body;

    console.log('📝 Super admin updating business:', {
      businessId,
      isEnabled,
      subscription: subscription ? (typeof subscription === 'string' ? subscription : JSON.stringify(subscription)) : undefined,
    });

    const updateData: any = {};
    if (isEnabled !== undefined) {
      updateData.isEnabled = isEnabled;
      console.log('📝 Setting isEnabled to:', isEnabled);
    }
    if (subscription !== undefined) {
      // Handle case where subscription might be a string JSON
      let subscriptionObj = subscription;
      if (typeof subscription === 'string') {
        try {
          subscriptionObj = JSON.parse(subscription);
        } catch (e) {
          console.error('❌ Failed to parse subscription string:', e);
          return NextResponse.json({ message: 'Invalid subscription format' }, { status: 400 });
        }
      }
      
      // If setting status to 'active', remove nextBillingDate to prevent auto-expire
      if (subscriptionObj.status === 'active') {
        delete subscriptionObj.nextBillingDate;
      }
      
      updateData.subscription = subscriptionObj;
      console.log('📝 Setting subscription to:', JSON.stringify(subscriptionObj, null, 2));
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ message: 'No fields to update' }, { status: 400 });
    }

    // Try RPC function first for better reliability
    let updateResult: any = null;
    let error: any = null;

    // Try RPC function for isEnabled updates
    if (updateData.isEnabled !== undefined && !updateData.subscription) {
      try {
        console.log('🔄 Calling RPC function update_business_is_enabled with:', {
          p_business_id: businessId,
          p_is_enabled: updateData.isEnabled,
        });
        const rpcResult = await supabaseAdmin.rpc('update_business_is_enabled', {
          p_business_id: businessId,
          p_is_enabled: updateData.isEnabled,
        });
        
        console.log('🔄 RPC result:', {
          hasError: !!rpcResult.error,
          error: rpcResult.error,
          hasData: !!rpcResult.data,
          dataLength: rpcResult.data?.length,
          data: rpcResult.data,
        });
        
        if (!rpcResult.error && rpcResult.data && rpcResult.data.length > 0) {
          const rpcData = rpcResult.data[0];
          console.log('✅ RPC function succeeded for isEnabled');
          console.log('✅ RPC returned isEnabled:', rpcData.isEnabled);
          console.log('✅ Expected isEnabled:', updateData.isEnabled);
          console.log('✅ Match?', rpcData.isEnabled === updateData.isEnabled);
          
          if (rpcData.isEnabled === updateData.isEnabled) {
            updateResult = { success: true, data: rpcResult.data };
          } else {
            console.error('❌ RPC function returned wrong value! Using standard update');
            error = { message: 'RPC returned wrong value' };
          }
        } else {
          console.log('⚠️ RPC function failed, using standard update');
          error = rpcResult.error;
        }
      } catch (rpcError: any) {
        console.log('⚠️ RPC function call failed:', rpcError.message);
        error = rpcError;
      }
    }

    // Try RPC function for subscription updates
    if (updateData.subscription && !updateResult) {
      try {
        const rpcResult = await supabaseAdmin.rpc('update_business_subscription', {
          p_business_id: businessId,
          p_subscription: updateData.subscription,
        });
        
        if (!rpcResult.error && rpcResult.data && rpcResult.data.length > 0) {
          console.log('✅ RPC function succeeded for subscription');
          updateResult = { success: true, data: rpcResult.data };
        } else {
          console.log('⚠️ RPC function failed, using standard update');
          error = rpcResult.error;
        }
      } catch (rpcError: any) {
        console.log('⚠️ RPC function call failed:', rpcError.message);
        error = rpcError;
      }
    }

    // If RPC didn't work, use standard update
    if (!updateResult) {
      console.log('🔄 Using standard update...');
      const standardResult = await supabaseAdmin
        .from('businesses')
        .update(updateData)
        .eq('businessId', businessId)
        .select();
      
      error = standardResult.error;
      if (!error && standardResult.data) {
        updateResult = { success: true, data: standardResult.data };
      }
    }

    if (error) {
      console.error('❌ Error updating business:', error);
      return NextResponse.json({ 
        message: 'Database error', 
        details: error.message 
      }, { status: 500 });
    }

    // Use the data from RPC function if available (it's already verified)
    let finalData = updateResult?.data?.[0];
    
    // If we used standard update, verify it persisted
    if (!finalData && updateResult?.data) {
      finalData = updateResult.data[0];
    }
    
    // Double-check by fetching fresh data (with a small delay to ensure transaction committed)
    if (finalData) {
      await new Promise(resolve => setTimeout(resolve, 100));
      const { data: verifyData } = await supabaseAdmin
        .from('businesses')
        .select('businessId, isEnabled, subscription')
        .eq('businessId', businessId)
        .maybeSingle();
      
      if (verifyData) {
        console.log('✅ Final verification - isEnabled:', verifyData.isEnabled);
        console.log('✅ Final verification - subscription:', JSON.stringify(verifyData.subscription, null, 2));
        
        // If verification shows different value, log warning but return what RPC said
        if (updateData.isEnabled !== undefined && verifyData.isEnabled !== updateData.isEnabled) {
          console.error('⚠️ WARNING: Verification shows different isEnabled value!');
          console.error('⚠️ Expected:', updateData.isEnabled, 'Got:', verifyData.isEnabled);
          console.error('⚠️ This might indicate a trigger or default value is overriding the update');
        }
        
        // Use verified data if available
        finalData = verifyData;
      }
    }

    console.log('✅ Business updated successfully');
    return NextResponse.json({ 
      message: 'Business updated successfully',
      business: finalData
    }, { status: 200 });
  } catch (error) {
    console.error('Error updating business', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}




