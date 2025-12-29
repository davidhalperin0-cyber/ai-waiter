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

    // USE RAW SQL VIA RPC - Bypass Supabase client completely
    let updateResult: any = null;
    let error: any = null;
    
    try {
      // Build SQL update statement
      let sqlParts: string[] = [];
      let params: any[] = [];
      let paramIndex = 1;
      
      if (updateData.isEnabled !== undefined) {
        sqlParts.push(`"isEnabled" = $${paramIndex}`);
        params.push(updateData.isEnabled);
        paramIndex++;
      }
      
      if (updateData.subscription) {
        sqlParts.push(`subscription = $${paramIndex}::jsonb`);
        params.push(JSON.stringify(updateData.subscription));
        paramIndex++;
      }
      
      if (sqlParts.length === 0) {
        return NextResponse.json({ message: 'No fields to update' }, { status: 400 });
      }
      
      params.push(businessId); // For WHERE clause
      
      const sql = `
        UPDATE public.businesses
        SET ${sqlParts.join(', ')}
        WHERE "businessId" = $${paramIndex}
        RETURNING "businessId", name, "isEnabled", subscription, "subscriptionlocked"
      `;
      
      console.log('🔧 Executing raw SQL:', sql);
      console.log('🔧 With params:', params);
      
      // Use RPC to execute raw SQL
      const { data: rpcData, error: rpcError } = await supabaseAdmin.rpc('exec_sql', {
        sql_query: sql,
        sql_params: params,
      });
      
      if (rpcError) {
        console.error('❌ RPC SQL execution failed:', rpcError);
        // Fallback to standard update
        const result = await supabaseAdmin
          .from('businesses')
          .update(updateData)
          .eq('businessId', businessId)
          .select();
        
        if (result.error) {
          error = result.error;
        } else if (result.data) {
          updateResult = { success: true, data: result.data[0] };
        }
      } else if (rpcData && rpcData.length > 0) {
        updateResult = { success: true, data: rpcData[0] };
      }
    } catch (sqlError: any) {
      console.error('❌ SQL execution error:', sqlError);
      // Fallback to standard update
      const result = await supabaseAdmin
        .from('businesses')
        .update(updateData)
        .eq('businessId', businessId)
        .select();
      
      if (result.error) {
        error = result.error;
      } else if (result.data) {
        updateResult = { success: true, data: result.data[0] };
      }
    }
    
    // If SQL didn't work, use standard update with single retry
    if (!updateResult && !error) {
      console.log('🔄 Using standard update as fallback...');
      const result = await supabaseAdmin
        .from('businesses')
        .update(updateData)
        .eq('businessId', businessId)
        .select();
      
      if (result.error) {
        error = result.error;
      } else if (result.data && result.data.length > 0) {
        // Verify immediately
        await new Promise(resolve => setTimeout(resolve, 100));
        const verifyResult = await supabaseAdmin
          .from('businesses')
          .select('businessId, isEnabled, subscription, subscriptionlocked')
          .eq('businessId', businessId)
          .maybeSingle();
        
        if (verifyResult.data) {
          updateResult = { success: true, data: verifyResult.data };
        } else {
          updateResult = { success: true, data: result.data[0] };
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




