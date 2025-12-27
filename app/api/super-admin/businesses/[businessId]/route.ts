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

    const { error, data } = await supabaseAdmin
      .from('businesses')
      .update(updateData)
      .eq('businessId', businessId)
      .select();

    if (error) {
      console.error('❌ Error updating business:', error);
      console.error('❌ Error details:', JSON.stringify(error, null, 2));
      return NextResponse.json({ message: 'Database error', details: error.message }, { status: 500 });
    }

    console.log('✅ Business updated successfully');
    console.log('✅ Updated data:', JSON.stringify(data, null, 2));

    // Verify the update
    const { data: verifyData, error: verifyError } = await supabaseAdmin
      .from('businesses')
      .select('isEnabled, subscription')
      .eq('businessId', businessId)
      .maybeSingle();

    if (verifyError) {
      console.error('❌ Verification error:', verifyError);
    } else {
      console.log('✅ Verification - isEnabled:', verifyData?.isEnabled);
      console.log('✅ Verification - subscription:', JSON.stringify(verifyData?.subscription, null, 2));
      
      if (subscription && verifyData?.subscription) {
        const statusMatch = verifyData.subscription.status === subscription.status;
        console.log('✅ Subscription status match:', statusMatch, {
          requested: subscription.status,
          actual: verifyData.subscription.status,
        });
        if (!statusMatch) {
          console.error('❌ Subscription status mismatch!');
        }
      }
    }

    return NextResponse.json({ message: 'Business updated successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error updating business', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}




