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

    // Use a fresh query with explicit cache control
    // Add a longer delay to ensure any pending transactions are fully committed
    // This is especially important after RPC updates
    // Increased delay to 4 seconds to ensure RPC transaction is fully committed and visible
    // This gives extra time for the connection pool to clear stale data
    await new Promise(resolve => setTimeout(resolve, 4000));
    
    // Create a fresh client instance to avoid connection pooling issues
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { message: 'Database configuration error' },
        { status: 500 },
      );
    }
    
    const freshClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
      },
      db: {
        schema: 'public',
      },
      global: {
        headers: {
          'x-client-info': 'super-admin-fresh-client',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      },
    });
    
    // Don't use RPC for reading - it has the same connection pooling issues
    // Instead, we'll rely on the delay and fresh client to get the latest data
    // The RPC read was returning stale data even with the updated function
    
    // Use a direct query with explicit ordering to ensure we get fresh data
    // The 3-second delay should be enough for the RPC transaction to be fully committed
    const { data: businesses, error } = await freshClient
      .from('businesses')
      .select('businessId, name, type, email, isEnabled, subscription, createdAt')
      .order('createdAt', { ascending: false });

    // Log raw data from DB
    const targetBusinessRaw = businesses?.find((b: any) => b.businessId === 'b72bca1a-7fd3-470d-998e-971785f30ab4');
    if (targetBusinessRaw) {
      console.log('🔍 GET /api/super-admin/businesses - Raw DB data for target business:', {
        businessId: targetBusinessRaw.businessId,
        isEnabled: targetBusinessRaw.isEnabled,
        isEnabledType: typeof targetBusinessRaw.isEnabled,
      });
    }

    // Ensure subscription is always an object, not a string
    const businessesWithParsedSubscription = (businesses || []).map((business: any) => ({
      ...business,
      subscription: typeof business.subscription === 'string' 
        ? JSON.parse(business.subscription) 
        : business.subscription || { status: 'trial', planType: 'full' },
    }));

    // Log after parsing
    const targetBusinessParsed = businessesWithParsedSubscription.find((b: any) => b.businessId === 'b72bca1a-7fd3-470d-998e-971785f30ab4');
    if (targetBusinessParsed) {
      console.log('🔍 GET /api/super-admin/businesses - Parsed data for target business:', {
        businessId: targetBusinessParsed.businessId,
        isEnabled: targetBusinessParsed.isEnabled,
        isEnabledType: typeof targetBusinessParsed.isEnabled,
      });
    }

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

