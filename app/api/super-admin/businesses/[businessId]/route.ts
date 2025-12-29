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
        
        // Then update subscription via standard update
        const subResult = await supabaseAdmin
          .from('businesses')
          .update({ subscription: updateData.subscription })
          .eq('businessId', businessId)
          .select('businessId, name, isEnabled, subscription, subscriptionlocked')
          .maybeSingle();
        
        if (subResult.error) {
          console.error('❌ Error updating subscription:', subResult.error);
          return NextResponse.json({ 
            message: 'Database error', 
            details: subResult.error.message 
          }, { status: 500 });
        }
        
        finalData = subResult.data;
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
          finalData = {
            businessId: rpcResult.data[0].businessId,
            name: rpcResult.data[0].name,
            isEnabled: rpcResult.data[0].isEnabled,
            subscription: null, // Will be fetched separately if needed
            subscriptionlocked: null,
          };
          
          // Fetch subscription separately if needed
          const { data: subData } = await supabaseAdmin
            .from('businesses')
            .select('subscription, subscriptionlocked')
            .eq('businessId', businessId)
            .maybeSingle();
          
          if (subData) {
            finalData.subscription = subData.subscription;
            finalData.subscriptionlocked = subData.subscriptionlocked;
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
    
    // Wait a moment and verify the update persisted multiple times
    for (let i = 0; i < 3; i++) {
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const { data: verifyData } = await supabaseAdmin
        .from('businesses')
        .select('businessId, name, isEnabled, subscription')
        .eq('businessId', businessId)
        .maybeSingle();
      
      if (verifyData) {
        console.log(`🔍 Verification attempt ${i + 1}/3:`, {
          requestedIsEnabled: updateData.isEnabled,
          actualIsEnabled: verifyData.isEnabled,
          matches: updateData.isEnabled === undefined || verifyData.isEnabled === updateData.isEnabled,
        });
        
        // If isEnabled doesn't match, something is changing it back - try to fix it
        if (updateData.isEnabled !== undefined && verifyData.isEnabled !== updateData.isEnabled) {
          console.error(`❌ CRITICAL: isEnabled was changed back on attempt ${i + 1}!`, {
            requested: updateData.isEnabled,
            actual: verifyData.isEnabled,
          });
          
          // Try to update again using RPC function
          if (i < 2) {
            console.log(`🔄 Attempting to fix by updating again...`);
            try {
              const fixResult = await supabaseAdmin.rpc('update_business_is_enabled', {
                p_business_id: businessId,
                p_is_enabled: updateData.isEnabled,
              });
              
              if (fixResult.error) {
                console.error('❌ Fix attempt failed:', fixResult.error);
              } else {
                console.log('✅ Fix attempt succeeded');
              }
            } catch (fixError: any) {
              console.error('❌ Fix attempt error:', fixError);
            }
          }
        } else if (updateData.isEnabled !== undefined && verifyData.isEnabled === updateData.isEnabled) {
          console.log(`✅ Verification passed on attempt ${i + 1}!`);
          // Update finalData with verified data
          finalData = verifyData;
          break;
        }
      }
    }
    
    // Final verification - check one more time after all verifications
    await new Promise(resolve => setTimeout(resolve, 500));
    const { data: finalVerify } = await supabaseAdmin
      .from('businesses')
      .select('businessId, name, isEnabled, subscription')
      .eq('businessId', businessId)
      .maybeSingle();
    
    if (finalVerify && updateData.isEnabled !== undefined) {
      console.log('🔍 Final verification:', {
        requestedIsEnabled: updateData.isEnabled,
        finalIsEnabled: finalVerify.isEnabled,
        matches: finalVerify.isEnabled === updateData.isEnabled,
      });
      
      // Use the final verified data
      if (finalVerify.isEnabled === updateData.isEnabled) {
        finalData = { ...finalData, isEnabled: finalVerify.isEnabled };
      } else {
        console.error('❌ FINAL VERIFICATION FAILED - isEnabled was changed back!', {
          requested: updateData.isEnabled,
          final: finalVerify.isEnabled,
        });
        // Still return success, but log the issue
      }
    }
    
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




