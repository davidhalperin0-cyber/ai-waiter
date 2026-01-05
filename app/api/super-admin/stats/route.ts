export const dynamic = 'force-dynamic';
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

    // Get total QR/NFC scans
    const { count: totalScans, error: scansError } = await supabaseAdmin
      .from('qr_scans')
      .select('*', { count: 'exact', head: true });

    if (scansError) {
      console.error('Error counting scans', scansError);
    }

    // Get scans in last 24 hours
    const { count: scansLast24h, error: scans24hError } = await supabaseAdmin
      .from('qr_scans')
      .select('*', { count: 'exact', head: true })
      .gte('scanned_at', todayStart.toISOString());

    if (scans24hError) {
      console.error('Error counting scans last 24h', scans24hError);
    }

    // Get total chat entries
    const { count: totalChatEntries, error: chatEntriesError } = await supabaseAdmin
      .from('chat_interactions')
      .select('*', { count: 'exact', head: true })
      .not('entered_chat_at', 'is', null);

    if (chatEntriesError) {
      console.error('Error counting chat entries', chatEntriesError);
    }

    // Get chat entries in last 24 hours
    const { count: chatEntriesLast24h, error: chatEntries24hError } = await supabaseAdmin
      .from('chat_interactions')
      .select('*', { count: 'exact', head: true })
      .not('entered_chat_at', 'is', null)
      .gte('entered_chat_at', todayStart.toISOString());

    if (chatEntries24hError) {
      console.error('Error counting chat entries last 24h', chatEntries24hError);
    }

    // Get total chat orders
    const { count: totalChatOrders, error: chatOrdersError } = await supabaseAdmin
      .from('chat_interactions')
      .select('*', { count: 'exact', head: true })
      .not('placed_order_at', 'is', null);

    if (chatOrdersError) {
      console.error('Error counting chat orders', chatOrdersError);
    }

    // Get chat orders in last 24 hours
    const { count: chatOrdersLast24h, error: chatOrders24hError } = await supabaseAdmin
      .from('chat_interactions')
      .select('*', { count: 'exact', head: true })
      .not('placed_order_at', 'is', null)
      .gte('placed_order_at', todayStart.toISOString());

    if (chatOrders24hError) {
      console.error('Error counting chat orders last 24h', chatOrders24hError);
    }

    return NextResponse.json(
      {
        totalBusinesses: totalBusinesses || 0,
        activeBusinesses: activeBusinesses || 0,
        totalOrders: totalOrders || 0,
        ordersToday: ordersToday || 0,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalTables: totalTables || 0,
        // Scan statistics
        totalScans: totalScans || 0,
        scansLast24h: scansLast24h || 0,
        // Chat statistics
        totalChatEntries: totalChatEntries || 0,
        chatEntriesLast24h: chatEntriesLast24h || 0,
        totalChatOrders: totalChatOrders || 0,
        chatOrdersLast24h: chatOrdersLast24h || 0,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('Error fetching platform stats', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}




