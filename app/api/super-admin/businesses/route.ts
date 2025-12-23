import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { isSuperAdmin } from '@/lib/superAdminAuth';

// GET /api/super-admin/businesses
// Returns all businesses with their stats
export async function GET(req: NextRequest) {
  try {
    // Check super admin authentication
    const token = req.cookies.get('auth')?.value;
    if (!(await isSuperAdmin(token))) {
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

          return {
            ...business,
            ordersCount: ordersRes.count || 0,
            tablesCount: tablesRes.count || 0,
          };
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

