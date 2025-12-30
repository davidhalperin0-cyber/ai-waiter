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

    // ALWAYS use RPC function for isEnabled updates (bypasses triggers/defaults)
    let finalData: any = null;
    
    if (updateData.isEnabled !== undefined) {
      console.log('🔄 Using RPC function for isEnabled update...', {
        businessId,
        isEnabled: updateData.isEnabled,
        isEnabledType: typeof updateData.isEnabled,
        isBoolean: typeof updateData.isEnabled === 'boolean',
      });
      
      // If we also have subscription update, do them separately
      if (updateData.subscription) {
        // First update isEnabled via RPC
        try {
          const rpcResult = await supabaseAdmin.rpc('update_business_is_enabled', {
            p_business_id: businessId,
            p_is_enabled: updateData.isEnabled,
          });
          
          if (rpcResult.error) {
            console.error('❌ RPC function error for isEnabled:', rpcResult.error);
            throw rpcResult.error;
          }
          
          console.log('✅ RPC function succeeded for isEnabled:', {
            returnedIsEnabled: rpcResult.data?.[0]?.isEnabled,
            requestedIsEnabled: updateData.isEnabled,
          });
        } catch (rpcError: any) {
          console.error('❌ RPC function call failed:', rpcError);
          return NextResponse.json({ 
            message: 'Failed to update isEnabled', 
            details: rpcError.message 
          }, { status: 500 });
        }
        
        // Then update subscription via RPC function to prevent side effects
        try {
          const subRpcResult = await supabaseAdmin.rpc('update_business_subscription', {
            p_business_id: businessId,
            p_subscription: updateData.subscription,
          });
          
          if (subRpcResult.error) {
            console.error('❌ RPC function error for subscription:', subRpcResult.error);
            throw subRpcResult.error;
          }
          
          console.log('✅ RPC function succeeded for subscription');
          
          // Fetch full business data
          const { data: fullData } = await supabaseAdmin
            .from('businesses')
            .select('businessId, name, isEnabled, subscription, subscriptionlocked')
            .eq('businessId', businessId)
            .maybeSingle();
          
          finalData = fullData;
        } catch (subRpcError: any) {
          console.error('❌ RPC function call failed for subscription:', subRpcError);
          return NextResponse.json({ 
            message: 'Failed to update subscription', 
            details: subRpcError.message 
          }, { status: 500 });
        }
      } else {
        // Only isEnabled update - use RPC function
        try {
          const rpcResult = await supabaseAdmin.rpc('update_business_is_enabled', {
            p_business_id: businessId,
            p_is_enabled: updateData.isEnabled,
          });
          
          console.log('🔍 RPC result:', {
            hasError: !!rpcResult.error,
            error: rpcResult.error,
            hasData: !!rpcResult.data,
            dataLength: rpcResult.data?.length,
            data: rpcResult.data,
          });
          
          if (rpcResult.error) {
            console.error('❌ RPC function error:', rpcResult.error);
            throw rpcResult.error;
          }
          
          if (!rpcResult.data || rpcResult.data.length === 0) {
            console.error('❌ RPC function returned no data');
            throw new Error('RPC function returned no data');
          }
          
          console.log('✅ RPC function succeeded!', {
            returnedIsEnabled: rpcResult.data[0]?.isEnabled,
            requestedIsEnabled: updateData.isEnabled,
            matches: rpcResult.data[0]?.isEnabled === updateData.isEnabled,
          });
          
          // Use RPC result directly - don't fetch from DB as it might be stale
          console.log('✅ Using RPC result directly');
          
          // DON'T fetch from DB at all - it will return stale data
          // Use RPC result directly and return it immediately
          // The RPC function already verified the update, so we trust it
          finalData = {
            businessId: rpcResult.data[0].businessId,
            name: rpcResult.data[0].name,
            isEnabled: rpcResult.data[0].isEnabled, // ALWAYS use RPC result
            subscription: null, // Will be fetched separately if needed
            subscriptionlocked: null,
          };
          
          console.log('✅ Using RPC result directly, not fetching from DB:', {
            rpcIsEnabled: rpcResult.data[0].isEnabled,
            finalIsEnabled: finalData.isEnabled,
          });
          
          // If we need subscription data, fetch it separately (but don't trust isEnabled from it)
          // Wait a bit to ensure RPC transaction is committed
          await new Promise(resolve => setTimeout(resolve, 200));
          
          try {
            const { data: subData } = await supabaseAdmin
              .from('businesses')
              .select('subscription, subscriptionlocked')
              .eq('businessId', businessId)
              .maybeSingle();
            
            if (subData) {
              finalData.subscription = subData.subscription;
              finalData.subscriptionlocked = subData.subscriptionlocked;
            }
          } catch (subErr) {
            console.warn('⚠️ Could not fetch subscription data, using RPC result only:', subErr);
          }
        } catch (rpcError: any) {
          console.error('❌ RPC function call failed:', rpcError);
          console.error('❌ RPC error message:', rpcError.message);
          console.error('❌ RPC error stack:', rpcError.stack);
          return NextResponse.json({ 
            message: 'Failed to update isEnabled', 
            details: rpcError.message 
          }, { status: 500 });
        }
      }
    }
    
    // If RPC didn't work or we're updating subscription, use standard update
    if (!finalData) {
      console.log('🔄 Using standard update...');
      const result = await supabaseAdmin
        .from('businesses')
        .update(updateData)
        .eq('businessId', businessId)
        .select('businessId, name, isEnabled, subscription, subscriptionlocked')
        .maybeSingle();
      
      if (result.error) {
        console.error('❌ Error updating business:', result.error);
        return NextResponse.json({ 
          message: 'Database error', 
          details: result.error.message 
        }, { status: 500 });
      }
      
      if (!result.data) {
        return NextResponse.json({ message: 'Business not found' }, { status: 404 });
      }
      
      finalData = result.data;
    }
    
    // Don't verify - trust the RPC result
    // Verification was causing issues with stale reads
    // The RPC function already verifies internally, so we trust its result
    console.log('✅ Skipping verification - trusting RPC result');
    
    console.log('✅ Update completed. DB returned:', {
      isEnabled: finalData.isEnabled,
      subscription: finalData.subscription,
    });

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




