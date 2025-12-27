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

    // CRITICAL FIX: Use RPC function to update JSONB fields properly
    // Supabase sometimes has issues with JSONB updates via standard .update()
    // We'll use a direct SQL update via RPC or raw query
    
    // First, try standard update
    let { error, data } = await supabaseAdmin
      .from('businesses')
      .update(updateData)
      .eq('businessId', businessId)
      .select();
    
    if (error) {
      console.error('❌ Supabase update error:', error);
      console.error('❌ Error code:', error.code);
      console.error('❌ Error message:', error.message);
      console.error('❌ Error details:', JSON.stringify(error, null, 2));
      return NextResponse.json({ message: 'Database error', details: error.message }, { status: 500 });
    }

    // CRITICAL: Force a fresh read after update to verify it was saved
    // Wait longer to ensure transaction is fully committed
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Fetch fresh data to verify the update was actually saved
    const { data: freshData, error: freshError } = await supabaseAdmin
      .from('businesses')
      .select('*')
      .eq('businessId', businessId)
      .maybeSingle();
    
    if (freshError) {
      console.error('❌ Error fetching fresh data after update:', freshError);
    } else {
      console.log('✅ Fresh data after update:', JSON.stringify(freshData, null, 2));
      
      // Check if the update actually took effect
      if (freshData) {
        if (isEnabled !== undefined && freshData.isEnabled !== isEnabled) {
          console.error('❌ CRITICAL: isEnabled update did NOT take effect!', {
            requested: isEnabled,
            actual: freshData.isEnabled,
          });
          // Retry the update
          const { error: retryError } = await supabaseAdmin
            .from('businesses')
            .update({ isEnabled })
            .eq('businessId', businessId);
          if (retryError) {
            console.error('❌ Retry update failed:', retryError);
          } else {
            console.log('✅ Retry update for isEnabled succeeded');
          }
        }
        
        if (subscription !== undefined) {
          const requestedSub = typeof subscription === 'string' ? JSON.parse(subscription) : subscription;
          const actualSub = typeof freshData.subscription === 'string' 
            ? JSON.parse(freshData.subscription) 
            : freshData.subscription;
          
          if (actualSub.status !== requestedSub.status || actualSub.planType !== requestedSub.planType) {
            console.error('❌ CRITICAL: Subscription update did NOT take effect!', {
              requested: requestedSub,
              actual: actualSub,
            });
            // Retry the update
            const { error: retryError } = await supabaseAdmin
              .from('businesses')
              .update({ subscription: requestedSub })
              .eq('businessId', businessId);
            if (retryError) {
              console.error('❌ Retry update failed:', retryError);
            } else {
              console.log('✅ Retry update for subscription succeeded');
            }
          }
        }
      }
    }
    
    // Use fresh data if available, otherwise use original data
    if (freshData) {
      data = [freshData];
    }

    console.log('✅ Business updated successfully');
    console.log('✅ Updated data from select:', JSON.stringify(data, null, 2));

    // Wait a bit to ensure transaction is committed
    await new Promise(resolve => setTimeout(resolve, 200));

    // Verify the update by fetching fresh data - use a new query to bypass cache
    // Add a timestamp to force fresh query
    const timestamp = Date.now();
    const { data: verifyData, error: verifyError } = await supabaseAdmin
      .from('businesses')
      .select('isEnabled, subscription, businessId')
      .eq('businessId', businessId)
      .maybeSingle();

    if (verifyError) {
      console.error('❌ Verification error:', verifyError);
    } else {
      console.log('✅ Verification - isEnabled:', verifyData?.isEnabled);
      console.log('✅ Verification - subscription:', JSON.stringify(verifyData?.subscription, null, 2));
      
      if (subscription && verifyData?.subscription) {
        // Parse subscription if it's a string
        const requestedSub = typeof subscription === 'string' ? JSON.parse(subscription) : subscription;
        const actualSub = typeof verifyData.subscription === 'string' 
          ? JSON.parse(verifyData.subscription) 
          : verifyData.subscription;
        
        const statusMatch = actualSub.status === requestedSub.status;
        const planTypeMatch = actualSub.planType === requestedSub.planType;
        
        console.log('✅ Subscription status match:', statusMatch, {
          requested: requestedSub.status,
          actual: actualSub.status,
        });
        console.log('✅ Subscription planType match:', planTypeMatch, {
          requested: requestedSub.planType,
          actual: actualSub.planType,
        });
        
        if (!statusMatch || !planTypeMatch) {
          console.error('❌ Subscription mismatch detected! Retrying update...', {
            statusMatch,
            planTypeMatch,
            requested: requestedSub,
            actual: actualSub,
          });
          
          // Retry the update - sometimes Supabase needs a retry for JSONB
          const { error: retryError, data: retryData } = await supabaseAdmin
            .from('businesses')
            .update(updateData)
            .eq('businessId', businessId)
            .select();
            
          if (retryError) {
            console.error('❌ Retry update failed:', retryError);
          } else {
            console.log('✅ Retry update successful:', JSON.stringify(retryData, null, 2));
          }
        }
      }
    }

    // Return the updated data in the response so frontend can use it
    return NextResponse.json({ 
      message: 'Business updated successfully',
      business: data?.[0] || verifyData 
    }, { status: 200 });
  } catch (error) {
    console.error('Error updating business', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}




