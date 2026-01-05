export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

// GET /api/scans/stats?businessId=...
// Get scan statistics for a business
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get('businessId');

    if (!businessId) {
      return NextResponse.json({ message: 'businessId is required' }, { status: 400 });
    }

    // Get total scans count
    const { count: totalScans, error: countError } = await supabaseAdmin
      .from('qr_scans')
      .select('*', { count: 'exact', head: true })
      .eq('business_id', businessId);

    if (countError) {
      console.error('Error getting scan count:', countError);
      return NextResponse.json({ message: 'Database error' }, { status: 500 });
    }

    // Get scans by table
    const { data: scansByTable, error: tableError } = await supabaseAdmin
      .from('qr_scans')
      .select('table_id')
      .eq('business_id', businessId);

    if (tableError) {
      console.error('Error getting scans by table:', tableError);
      return NextResponse.json({ message: 'Database error' }, { status: 500 });
    }

    // Count scans per table
    const tableCounts: Record<string, number> = {};
    scansByTable?.forEach((scan) => {
      tableCounts[scan.table_id] = (tableCounts[scan.table_id] || 0) + 1;
    });

    // Get scans by source (QR, NFC, etc.)
    const { data: scansBySource, error: sourceError } = await supabaseAdmin
      .from('qr_scans')
      .select('source')
      .eq('business_id', businessId);

    if (sourceError) {
      console.error('Error getting scans by source:', sourceError);
      return NextResponse.json({ message: 'Database error' }, { status: 500 });
    }

    // Count scans per source
    const sourceCounts: Record<string, number> = {};
    scansBySource?.forEach((scan) => {
      const source = scan.source || 'unknown';
      sourceCounts[source] = (sourceCounts[source] || 0) + 1;
    });

    // Get scans in last 24 hours
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const { count: scansLast24h, error: last24hError } = await supabaseAdmin
      .from('qr_scans')
      .select('*', { count: 'exact', head: true })
      .eq('business_id', businessId)
      .gte('scanned_at', yesterday.toISOString());

    if (last24hError) {
      console.error('Error getting scans last 24h:', last24hError);
    }

    // Get scans in last 7 days
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    
    const { count: scansLast7d, error: last7dError } = await supabaseAdmin
      .from('qr_scans')
      .select('*', { count: 'exact', head: true })
      .eq('business_id', businessId)
      .gte('scanned_at', lastWeek.toISOString());

    if (last7dError) {
      console.error('Error getting scans last 7d:', last7dError);
    }

    // Get chat statistics
    const { count: totalChatEntries, error: chatEntriesError } = await supabaseAdmin
      .from('chat_interactions')
      .select('*', { count: 'exact', head: true })
      .eq('business_id', businessId)
      .not('entered_chat_at', 'is', null);

    if (chatEntriesError) {
      console.error('Error getting chat entries:', chatEntriesError);
    }

    const { count: totalChatOrders, error: chatOrdersError } = await supabaseAdmin
      .from('chat_interactions')
      .select('*', { count: 'exact', head: true })
      .eq('business_id', businessId)
      .not('placed_order_at', 'is', null);

    if (chatOrdersError) {
      console.error('Error getting chat orders:', chatOrdersError);
    }

    // Get chat entries in last 24 hours
    const { count: chatEntriesLast24h, error: chatEntries24hError } = await supabaseAdmin
      .from('chat_interactions')
      .select('*', { count: 'exact', head: true })
      .eq('business_id', businessId)
      .not('entered_chat_at', 'is', null)
      .gte('entered_chat_at', yesterday.toISOString());

    if (chatEntries24hError) {
      console.error('Error getting chat entries last 24h:', chatEntries24hError);
    }

    // Get chat orders in last 24 hours
    const { count: chatOrdersLast24h, error: chatOrders24hError } = await supabaseAdmin
      .from('chat_interactions')
      .select('*', { count: 'exact', head: true })
      .eq('business_id', businessId)
      .not('placed_order_at', 'is', null)
      .gte('placed_order_at', yesterday.toISOString());

    if (chatOrders24hError) {
      console.error('Error getting chat orders last 24h:', chatOrders24hError);
    }

    // Get chat entries in last 7 days
    const { count: chatEntriesLast7d, error: chatEntries7dError } = await supabaseAdmin
      .from('chat_interactions')
      .select('*', { count: 'exact', head: true })
      .eq('business_id', businessId)
      .not('entered_chat_at', 'is', null)
      .gte('entered_chat_at', lastWeek.toISOString());

    if (chatEntries7dError) {
      console.error('Error getting chat entries last 7d:', chatEntries7dError);
    }

    // Get chat orders in last 7 days
    const { count: chatOrdersLast7d, error: chatOrders7dError } = await supabaseAdmin
      .from('chat_interactions')
      .select('*', { count: 'exact', head: true })
      .eq('business_id', businessId)
      .not('placed_order_at', 'is', null)
      .gte('placed_order_at', lastWeek.toISOString());

    if (chatOrders7dError) {
      console.error('Error getting chat orders last 7d:', chatOrders7dError);
    }

    return NextResponse.json({
      totalScans: totalScans || 0,
      scansLast24h: scansLast24h || 0,
      scansLast7d: scansLast7d || 0,
      scansByTable: tableCounts,
      scansBySource: sourceCounts,
      // Chat statistics
      totalChatEntries: totalChatEntries || 0,
      totalChatOrders: totalChatOrders || 0,
      chatEntriesLast24h: chatEntriesLast24h || 0,
      chatOrdersLast24h: chatOrdersLast24h || 0,
      chatEntriesLast7d: chatEntriesLast7d || 0,
      chatOrdersLast7d: chatOrdersLast7d || 0,
    }, { status: 200 });
  } catch (error) {
    console.error('Error in scan stats endpoint:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

