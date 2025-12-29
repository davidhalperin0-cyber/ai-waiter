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

    // USE RPC FUNCTIONS FOR RELIABLE UPDATES
    let updatedBusiness: any = null;
    
    // Update isEnabled using RPC function if needed
    if (updateData.isEnabled !== undefined) {
      console.log('🔄 Using RPC function for isEnabled update...');
      const rpcResult = await supabaseAdmin.rpc('update_business_is_enabled', {
        p_business_id: businessId,
        p_is_enabled: updateData.isEnabled,
      });
      
      if (rpcResult.error) {
        console.error('❌ RPC function error:', rpcResult.error);
        // Fallback to standard update
        const result = await supabaseAdmin
          .from('businesses')
          .update({ isEnabled: updateData.isEnabled })
          .eq('businessId', businessId)
          .select('businessId, name, isEnabled, subscription, subscriptionlocked')
          .maybeSingle();
        
        if (result.error) {
          return NextResponse.json({ 
            message: 'Database error', 
            details: result.error.message 
          }, { status: 500 });
        }
        
        if (!result.data) {
          return NextResponse.json({ message: 'Business not found' }, { status: 404 });
        }
        
        updatedBusiness = result.data;
      } else if (rpcResult.data && rpcResult.data.length > 0) {
        updatedBusiness = rpcResult.data[0];
        console.log('✅ RPC function succeeded for isEnabled');
      }
    }
    
    // Update subscription using RPC function if needed
    if (updateData.subscription) {
      console.log('🔄 Using RPC function for subscription update...');
      const rpcResult = await supabaseAdmin.rpc('update_business_subscription', {
        p_business_id: businessId,
        p_subscription: updateData.subscription,
      });
      
      if (rpcResult.error) {
        console.error('❌ RPC function error:', rpcResult.error);
        // Fallback to standard update
        const result = await supabaseAdmin
          .from('businesses')
          .update({ subscription: updateData.subscription })
          .eq('businessId', businessId)
          .select('businessId, name, isEnabled, subscription, subscriptionlocked')
          .maybeSingle();
        
        if (result.error) {
          return NextResponse.json({ 
            message: 'Database error', 
            details: result.error.message 
          }, { status: 500 });
        }
        
        if (!result.data) {
          return NextResponse.json({ message: 'Business not found' }, { status: 404 });
        }
        
        updatedBusiness = result.data;
      } else if (rpcResult.data && rpcResult.data.length > 0) {
        updatedBusiness = rpcResult.data[0];
        console.log('✅ RPC function succeeded for subscription');
      }
    }
    
    // If we didn't use RPC, use standard update
    if (!updatedBusiness) {
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
      
      updatedBusiness = result.data;
    }
    
    // Fetch fresh data to ensure we have the latest
    await new Promise(resolve => setTimeout(resolve, 100));
    const { data: freshData } = await supabaseAdmin
      .from('businesses')
      .select('businessId, name, isEnabled, subscription, subscriptionlocked')
      .eq('businessId', businessId)
      .maybeSingle();
    
    const finalData = freshData || updatedBusiness;
    
    console.log('✅ Update completed. Final data:', {
      isEnabled: finalData.isEnabled,
      subscription: finalData.subscription,
    });
    
    // Verify the update actually persisted
    if (updateData.isEnabled !== undefined && finalData.isEnabled !== updateData.isEnabled) {
      console.error('❌ CRITICAL: Update did not persist!', {
        expected: updateData.isEnabled,
        actual: finalData.isEnabled,
      });
      // Try one more direct update
      const retryResult = await supabaseAdmin
        .from('businesses')
        .update({ isEnabled: updateData.isEnabled })
        .eq('businessId', businessId)
        .select('businessId, name, isEnabled, subscription')
        .maybeSingle();
      
      if (retryResult.data) {
        console.log('✅ Retry update succeeded');
        return NextResponse.json({ 
          message: 'Business updated successfully (retry)',
          business: retryResult.data
        }, { status: 200 });
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




