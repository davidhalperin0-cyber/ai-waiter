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

    // Ensure subscription is always an object, not a string
    const businessesWithParsedSubscription = (businesses || []).map((business: any) => ({
      ...business,
      subscription: typeof business.subscription === 'string' 
        ? JSON.parse(business.subscription) 
        : business.subscription || { status: 'trial', planType: 'full' },
    }));

    if (error) {
      console.error('Error fetching businesses', error);
      return NextResponse.json(
        { message: 'Database error while fetching businesses', details: error.message },
        { status: 500 },
      );
    }

    // Get stats for each business (orders count, tables count) - with timeout
    const businessesWithStats = await Promise.all(
      businessesWithParsedSubscription.map(async (business) => {
        try {
          // Add timeout to prevent hanging
          const statsPromise = Promise.all([
            supabaseAdmin
              .from('orders')
              .select('orderId', { count: 'exact', head: true })
              .eq('businessId', business.businessId),
            supabaseAdmin
              .from('tables')
              .select('tableId', { count: 'exact', head: true })
              .eq('businessId', business.businessId),
          ]);

          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), 2000)
          );

          const [ordersRes, tablesRes] = await Promise.race([
            statsPromise,
            timeoutPromise,
          ]) as any[];

          if (ordersRes?.error) {
            console.error('Error counting orders for business', business.businessId, ordersRes.error);
          }
          if (tablesRes?.error) {
            console.error('Error counting tables for business', business.businessId, tablesRes.error);
          }

          return {
            ...business,
            ordersCount: ordersRes?.count || 0,
            tablesCount: tablesRes?.count || 0,
          };
        } catch (err: any) {
          // If timeout or error, return with 0 counts
          if (err.message === 'Timeout') {
            console.warn('Timeout counting stats for business', business.businessId);
          } else {
            console.error('Error fetching stats for business', business.businessId, err);
          }
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

