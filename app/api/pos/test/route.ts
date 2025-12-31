export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { verifyAuthToken } from '@/lib/auth';
import { PosConfig, Order } from '@/lib/types';
import { getPosAdapter } from '@/lib/pos/adapters';
import { orderToCanonical } from '@/lib/pos/orderMapper';

// POST /api/pos/test
// Authenticated business only - tests POS connection
export async function POST(req: NextRequest) {
  try {
    // Authenticate request
    const token = req.cookies.get('auth')?.value;
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyAuthToken(token);
    if (!payload || payload.role !== 'business') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { businessId, testOrder } = body as {
      businessId?: string;
      testOrder?: Order;
    };

    if (!businessId || businessId !== payload.businessId) {
      return NextResponse.json({ message: 'Invalid businessId' }, { status: 400 });
    }

    // Get POS config
    const { data: business, error: fetchError } = await supabaseAdmin
      .from('businesses')
      .select('posConfig')
      .eq('businessId', businessId)
      .maybeSingle();

    if (fetchError || !business) {
      return NextResponse.json({ message: 'Business not found' }, { status: 404 });
    }

    const posConfig = business.posConfig as PosConfig | null;

    if (!posConfig || !posConfig.enabled || !posConfig.endpoint) {
      return NextResponse.json({ message: 'POS config is not enabled or endpoint is missing' }, { status: 400 });
    }

    // Create test order if not provided
    const order: Order = testOrder || {
      orderId: 'test-' + Date.now(),
      businessId,
      tableId: 'test-table',
      items: [
        {
          menuItemId: 'test-item',
          name: 'פריט בדיקה',
          price: 10,
          quantity: 1,
        },
      ],
      totalAmount: 10,
      status: 'received',
      createdAt: new Date().toISOString(),
    };

    try {
      // Convert test order to canonical format
      const canonicalOrder = orderToCanonical(order, 'QR_MENU');
      
      // Resolve adapter based on provider
      const adapter = getPosAdapter(posConfig.provider);
      
      // Send test order via adapter
      await adapter.sendOrder(canonicalOrder, posConfig);
      
      return NextResponse.json({ message: 'POS connection test successful' }, { status: 200 });
    } catch (adapterError: any) {
      // Extract error message
      const errorMessage = adapterError.message || 'Connection failed';
      
      // Check if it's a timeout
      if (errorMessage.includes('timeout')) {
        return NextResponse.json(
          { message: errorMessage },
          { status: 408 },
        );
      }
      
      // Check if it's an HTTP error
      if (errorMessage.includes('returned error')) {
        return NextResponse.json(
          { message: errorMessage },
          { status: 500 },
        );
      }
      
      return NextResponse.json(
        { message: 'Connection failed', details: errorMessage },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error('Error testing POS connection', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

