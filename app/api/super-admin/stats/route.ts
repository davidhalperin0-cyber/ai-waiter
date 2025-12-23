import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { isSuperAdmin } from '@/lib/superAdminAuth';

// GET /api/super-admin/stats
// Returns platform-wide statistics
export async function GET(req: NextRequest) {
  try {
    // Check super admin authentication
    const token = req.cookies.get('auth')?.value;
    if (!(await isSuperAdmin(token))) {
      return NextResponse.json({ message: 'Unauthorized - Super admin access required' }, { status: 403 });
    }

    // Get total businesses
    const { count: totalBusinesses, error: businessesError } = await supabaseAdmin
      .from('businesses')
      .select('*', { count: 'exact', head: true });

    if (businessesError) {
      console.error('Error counting businesses', businessesError);
    }

    // Get active businesses
    const { count: activeBusinesses, error: activeError } = await supabaseAdmin
      .from('businesses')
      .select('*', { count: 'exact', head: true })
      .eq('isEnabled', true);

    if (activeError) {
      console.error('Error counting active businesses', activeError);
    }

    // Get total orders
    const { count: totalOrders, error: ordersError } = await supabaseAdmin
      .from('orders')
      .select('*', { count: 'exact', head: true });

    if (ordersError) {
      console.error('Error counting orders', ordersError);
    }

    // Get total revenue (sum of all order amounts)
    const { data: orders, error: revenueError } = await supabaseAdmin
      .from('orders')
      .select('totalAmount');

    let totalRevenue = 0;
    if (!revenueError && orders) {
      totalRevenue = orders.reduce((sum, order) => sum + Number(order.totalAmount || 0), 0);
    }

    // Get orders today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const { count: ordersToday, error: todayError } = await supabaseAdmin
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .gte('createdAt', todayStart.toISOString());

    if (todayError) {
      console.error('Error counting today orders', todayError);
    }

    // Get total tables
    const { count: totalTables, error: tablesError } = await supabaseAdmin
      .from('tables')
      .select('*', { count: 'exact', head: true });

    if (tablesError) {
      console.error('Error counting tables', tablesError);
    }

    return NextResponse.json(
      {
        totalBusinesses: totalBusinesses || 0,
        activeBusinesses: activeBusinesses || 0,
        totalOrders: totalOrders || 0,
        ordersToday: ordersToday || 0,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalTables: totalTables || 0,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('Error fetching platform stats', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}




