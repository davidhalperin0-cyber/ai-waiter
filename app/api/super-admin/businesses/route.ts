export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { isSuperAdmin } from '@/lib/superAdminAuth';

// GET /api/super-admin/businesses
// Returns all businesses with their stats
export async function GET(req: NextRequest) {
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
      return NextResponse.json({ message: 'Unauthorized - No authentication token' }, { status: 403 });
    }
    
    const isAdmin = await isSuperAdmin(token);
    if (!isAdmin) {
      console.error('Super admin check failed');
      return NextResponse.json({ message: 'Unauthorized - Super admin access required' }, { status: 403 });
    }

    const { data: businesses, error } = await supabaseAdmin
      .from('businesses')
      .select('businessId, name, type, email, isEnabled, subscription, createdAt')
      .order('createdAt', { ascending: false });

    if (error) {
      console.error('Error fetching businesses', error);
      return NextResponse.json(
        { message: 'Database error while fetching businesses', details: error.message },
        { status: 500 },
      );
    }

    console.log('📋 Raw businesses from DB:', businesses?.map(b => ({
      businessId: b.businessId,
      name: b.name,
      subscription: b.subscription,
      subscriptionType: typeof b.subscription,
    })));

    // Get stats for each business (orders count, tables count)
    const businessesWithStats = await Promise.all(
      (businesses || []).map(async (business) => {
        try {
          const [ordersRes, tablesRes] = await Promise.all([
            supabaseAdmin
              .from('orders')
              .select('orderId', { count: 'exact', head: true })
              .eq('businessId', business.businessId),
            supabaseAdmin
              .from('tables')
              .select('tableId', { count: 'exact', head: true })
              .eq('businessId', business.businessId),
          ]);

          if (ordersRes.error) {
            console.error('Error counting orders for business', business.businessId, ordersRes.error);
          }
          if (tablesRes.error) {
            console.error('Error counting tables for business', business.businessId, tablesRes.error);
          }

          // Ensure subscription is an object (handle case where it might be a string)
          let subscription = business.subscription;
          if (typeof subscription === 'string') {
            try {
              subscription = JSON.parse(subscription);
            } catch (e) {
              console.warn('Failed to parse subscription for business', business.businessId, e);
              subscription = { status: 'trial', planType: 'full' };
            }
          }
          if (!subscription || typeof subscription !== 'object') {
            subscription = { status: 'trial', planType: 'full' };
          }

          const result = {
            ...business,
            subscription,
            ordersCount: ordersRes.count || 0,
            tablesCount: tablesRes.count || 0,
          };
          console.log('📋 Processed business:', {
            businessId: result.businessId,
            name: result.name,
            subscription: result.subscription,
            subscriptionType: typeof result.subscription,
          });
          return result;
        } catch (err: any) {
          console.error('Error fetching stats for business', business.businessId, err);
          return {
            ...business,
            ordersCount: 0,
            tablesCount: 0,
          };
        }
      }),
    );

    return NextResponse.json({ businesses: businessesWithStats }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching businesses', error);
    return NextResponse.json(
      { message: 'Internal server error while fetching businesses', details: error?.message || String(error) },
      { status: 500 },
    );
  }
}

