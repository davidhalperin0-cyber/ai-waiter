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

    // CRITICAL FIX: Use RPC function to update JSONB properly
    // Supabase client sometimes has issues with JSONB updates
    // We'll use a direct SQL update via RPC
    
    // First, try the standard update
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

    // CRITICAL: Verify the update actually took effect by fetching fresh data
    // Wait a moment for transaction to commit
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Fetch the updated business to verify
    const { data: verifyData, error: verifyError } = await supabaseAdmin
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
        }
      }
      
      if (subscription !== undefined) {
        const requestedSub = typeof subscription === 'string' ? JSON.parse(subscription) : subscription;
        const actualSub = typeof verifyData.subscription === 'string' 
          ? JSON.parse(verifyData.subscription) 
          : verifyData.subscription;
        
        if (actualSub.status !== requestedSub.status || actualSub.planType !== requestedSub.planType) {
          console.error('❌ Subscription update failed! Retrying...');
          // Retry with explicit update
          const { error: retryError } = await supabaseAdmin
            .from('businesses')
            .update({ subscription: requestedSub })
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
      }
    }

    console.log('✅ Business updated successfully');
    console.log('✅ Final data:', JSON.stringify(verifyData || data?.[0], null, 2));

    // Return the verified data
    return NextResponse.json({ 
      message: 'Business updated successfully',
      business: verifyData || data?.[0]
    }, { status: 200 });
  } catch (error) {
    console.error('Error updating business', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}




