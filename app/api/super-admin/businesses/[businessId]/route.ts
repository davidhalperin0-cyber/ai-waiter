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
      subscriptionType: subscription ? typeof subscription : undefined,
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
          console.log('📝 Parsed subscription from string:', JSON.stringify(subscriptionObj, null, 2));
        } catch (e) {
          console.error('❌ Failed to parse subscription string:', e);
          return NextResponse.json({ message: 'Invalid subscription format' }, { status: 400 });
        }
      }
      updateData.subscription = subscriptionObj;
      console.log('📝 Setting subscription to:', JSON.stringify(subscriptionObj, null, 2));
    }

    if (Object.keys(updateData).length === 0) {
      console.warn('⚠️ No fields to update');
      return NextResponse.json({ message: 'No fields to update' }, { status: 400 });
    }

    console.log('📝 Update payload:', JSON.stringify(updateData, null, 2));

    // CRITICAL FIX: Try using RPC function first if updating subscription
    // This bypasses any RLS or trigger issues
    let { error, data } = null as any;
    
    if (subscription !== undefined && !isEnabled) {
      // Try RPC function for subscription updates
      const subscriptionObj = typeof subscription === 'string' ? JSON.parse(subscription) : subscription;
      console.log('🔄 Trying RPC function for subscription update...');
      const rpcResult = await supabaseAdmin.rpc('update_business_subscription', {
        p_business_id: businessId,
        p_subscription: subscriptionObj,
      });
      
      if (!rpcResult.error && rpcResult.data && rpcResult.data.length > 0) {
        console.log('✅ RPC function succeeded!');
        data = rpcResult.data;
        error = null;
      } else {
        console.log('⚠️ RPC function failed or not available, falling back to standard update');
        console.log('RPC error:', rpcResult.error);
      }
    }
    
    // If RPC didn't work or we're updating isEnabled, use standard update
    if (!data || error) {
      console.log('🔄 Using standard update...');
      const updateResult = await supabaseAdmin
        .from('businesses')
        .update(updateData)
        .eq('businessId', businessId)
        .select();
      
      error = updateResult.error;
      data = updateResult.data;
    }
    
    if (error) {
      console.error('❌ Supabase update error:', error);
      console.error('❌ Error code:', error.code);
      console.error('❌ Error message:', error.message);
      console.error('❌ Error details:', JSON.stringify(error, null, 2));
      return NextResponse.json({ message: 'Database error', details: error.message }, { status: 500 });
    }

    // CRITICAL: Verify the update actually took effect by fetching fresh data
    // Wait a moment for transaction to commit
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Fetch the updated business to verify
    let { data: verifyData, error: verifyError } = await supabaseAdmin
      .from('businesses')
      .select('*')
      .eq('businessId', businessId)
      .maybeSingle();
    
    if (verifyError) {
      console.error('❌ Error verifying update:', verifyError);
    } else {
      console.log('✅ Verified update - isEnabled:', verifyData?.isEnabled);
      console.log('✅ Verified update - subscription:', JSON.stringify(verifyData?.subscription, null, 2));
      
      // Check if update actually took effect
      if (isEnabled !== undefined && verifyData?.isEnabled !== isEnabled) {
        console.error('❌ isEnabled update failed! Retrying with RPC...');
        // Retry with explicit update
        const { error: retryError } = await supabaseAdmin
          .from('businesses')
          .update({ isEnabled })
          .eq('businessId', businessId);
        if (retryError) {
          console.error('❌ Retry failed:', retryError);
        } else {
          // Fetch again after retry
          const { data: retryData } = await supabaseAdmin
            .from('businesses')
            .select('*')
            .eq('businessId', businessId)
            .maybeSingle();
          if (retryData) {
            verifyData = retryData;
          }
        }
      }
      
      if (subscription !== undefined) {
        const requestedSub = typeof subscription === 'string' ? JSON.parse(subscription) : subscription;
        const actualSub = typeof verifyData.subscription === 'string' 
          ? JSON.parse(verifyData.subscription) 
          : verifyData.subscription;
        
        if (actualSub.status !== requestedSub.status || actualSub.planType !== requestedSub.planType) {
          console.error('❌ Subscription update failed! Retrying with multiple attempts...');
          console.error('❌ Requested:', requestedSub);
          console.error('❌ Actual:', actualSub);
          
          // Try multiple retry attempts
          for (let attempt = 1; attempt <= 3; attempt++) {
            console.log(`🔄 Retry attempt ${attempt}/3...`);
            const { error: retryError } = await supabaseAdmin
              .from('businesses')
              .update({ subscription: requestedSub })
              .eq('businessId', businessId);
            
            if (retryError) {
              console.error(`❌ Retry attempt ${attempt} failed:`, retryError);
              if (attempt < 3) {
                await new Promise(resolve => setTimeout(resolve, 300));
              }
            } else {
              console.log(`✅ Retry attempt ${attempt} succeeded`);
              // Wait and fetch again
              await new Promise(resolve => setTimeout(resolve, 500));
              const { data: retryData } = await supabaseAdmin
                .from('businesses')
                .select('*')
                .eq('businessId', businessId)
                .maybeSingle();
              if (retryData) {
                const retrySub = typeof retryData.subscription === 'string' 
                  ? JSON.parse(retryData.subscription) 
                  : retryData.subscription;
                if (retrySub.status === requestedSub.status && retrySub.planType === requestedSub.planType) {
                  verifyData = retryData;
                  console.log('✅ Retry verified - update persisted!');
                  break;
                } else {
                  console.error('❌ Retry data still wrong:', retrySub);
                }
              }
            }
          }
        }
      }
    }

    console.log('✅ Business updated successfully');
    console.log('✅ Final data:', JSON.stringify(verifyData || data?.[0], null, 2));
    
    // CRITICAL: Double-check the final data matches what we requested
    if (verifyData) {
      if (isEnabled !== undefined && verifyData.isEnabled !== isEnabled) {
        console.error('❌ FINAL CHECK FAILED: isEnabled mismatch!', {
          requested: isEnabled,
          actual: verifyData.isEnabled,
        });
      }
      
      if (subscription !== undefined) {
        const requestedSub = typeof subscription === 'string' ? JSON.parse(subscription) : subscription;
        const finalSub = typeof verifyData.subscription === 'string' 
          ? JSON.parse(verifyData.subscription) 
          : verifyData.subscription;
        
        if (finalSub.status !== requestedSub.status || finalSub.planType !== requestedSub.planType) {
          console.error('❌ FINAL CHECK FAILED: Subscription mismatch!', {
            requested: requestedSub,
            actual: finalSub,
          });
          // Return error instead of wrong data
          return NextResponse.json({ 
            message: 'Update did not persist correctly',
            error: 'Subscription update failed to persist',
            requested: requestedSub,
            actual: finalSub
          }, { status: 500 });
        }
      }
    }

    // Return the verified data
    return NextResponse.json({ 
      message: 'Business updated successfully',
      business: verifyData || data?.[0]
    }, { status: 200 });
  } catch (error: any) {
    console.error('❌ Error updating business:', error);
    console.error('❌ Error stack:', error?.stack);
    console.error('❌ Error message:', error?.message);
    return NextResponse.json({ 
      message: 'Internal server error',
      error: error?.message || String(error),
      stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined
    }, { status: 500 });
  }
}




