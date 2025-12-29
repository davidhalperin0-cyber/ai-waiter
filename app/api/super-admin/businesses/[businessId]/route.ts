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

    // DIRECT UPDATE WITH RETRY - Skip RPC, use direct SQL with aggressive retry
    let updateResult: any = null;
    let error: any = null;
    const maxRetries = 5;
    
    for (let retry = 0; retry < maxRetries; retry++) {
      console.log(`🔄 Direct update attempt ${retry + 1}/${maxRetries}...`);
      
      // Direct update
      const result = await supabaseAdmin
        .from('businesses')
        .update(updateData)
        .eq('businessId', businessId)
        .select();
      
      if (result.error) {
        console.error(`❌ Update attempt ${retry + 1} failed:`, result.error);
        error = result.error;
        if (retry < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, 100 * (retry + 1)));
          continue;
        }
        break;
      }
      
      if (result.data && result.data.length > 0) {
        // Verify immediately
        await new Promise(resolve => setTimeout(resolve, 50));
        const verifyResult = await supabaseAdmin
          .from('businesses')
          .select('businessId, isEnabled, subscription')
          .eq('businessId', businessId)
          .maybeSingle();
        
        if (verifyResult.data) {
          let isCorrect = true;
          
          // Check isEnabled
          if (updateData.isEnabled !== undefined) {
            if (verifyResult.data.isEnabled !== updateData.isEnabled) {
              console.error(`❌ Verification failed: isEnabled expected ${updateData.isEnabled}, got ${verifyResult.data.isEnabled}`);
              isCorrect = false;
            }
          }
          
          // Check subscription
          if (updateData.subscription) {
            const requestedStatus = typeof updateData.subscription === 'string' 
              ? JSON.parse(updateData.subscription).status 
              : updateData.subscription.status;
            const actualStatus = verifyResult.data.subscription?.status;
            if (actualStatus !== requestedStatus) {
              console.error(`❌ Verification failed: subscription status expected ${requestedStatus}, got ${actualStatus}`);
              isCorrect = false;
            }
          }
          
          if (isCorrect) {
            console.log(`✅ Update verified successfully on attempt ${retry + 1}`);
            updateResult = { success: true, data: verifyResult.data };
            break;
          } else if (retry < maxRetries - 1) {
            console.log(`⚠️ Verification failed, retrying... (${retry + 1}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, 200 * (retry + 1)));
            continue;
          }
        }
      }
    }

    if (error && !updateResult) {
      console.error('❌ Error updating business after all retries:', error);
      return NextResponse.json({ 
        message: 'Database error', 
        details: error.message 
      }, { status: 500 });
    }
    
    if (!updateResult) {
      return NextResponse.json({ 
        message: 'Update failed after multiple attempts' 
      }, { status: 500 });
    }

    // Use the verified data
    const finalData = updateResult.data;

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




