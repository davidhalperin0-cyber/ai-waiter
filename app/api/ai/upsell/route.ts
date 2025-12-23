import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

// GET /api/ai/upsell?businessId=...&itemName=...
// Returns a suggested upsell item based on co-occurrence statistics
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get('businessId');
    const itemName = searchParams.get('itemName');

    if (!businessId || !itemName) {
      return NextResponse.json({ message: 'businessId and itemName are required' }, { status: 400 });
    }

    // Get all orders for this business
    const { data: orders, error: ordersError } = await supabaseAdmin
      .from('orders')
      .select('items')
      .eq('businessId', businessId);

    if (ordersError) {
      console.error('Error fetching orders for upsell:', ordersError);
      return NextResponse.json({ message: 'Database error' }, { status: 500 });
    }

    if (!orders || orders.length === 0) {
      return NextResponse.json({ suggestedItem: null }, { status: 200 });
    }

    // Calculate co-occurrence: which items appear together with the given item
    const coOccurrence: Record<string, number> = {};
    let totalOccurrences = 0;

    for (const order of orders) {
      const items = order.items as Array<{ name: string; quantity: number }>;
      const itemNames = items.map((i) => i.name.toLowerCase());
      const hasTargetItem = itemNames.includes(itemName.toLowerCase());

      if (hasTargetItem) {
        totalOccurrences++;
        // Count other items in the same order
        for (const item of items) {
          const otherItemName = item.name.toLowerCase();
          if (otherItemName !== itemName.toLowerCase()) {
            coOccurrence[otherItemName] = (coOccurrence[otherItemName] || 0) + item.quantity;
          }
        }
      }
    }

    if (totalOccurrences === 0 || Object.keys(coOccurrence).length === 0) {
      return NextResponse.json({ suggestedItem: null }, { status: 200 });
    }

    // Find the most frequently co-occurring item
    let maxCount = 0;
    let suggestedItemName: string | null = null;

    for (const [itemName, count] of Object.entries(coOccurrence)) {
      if (count > maxCount) {
        maxCount = count;
        suggestedItemName = itemName;
      }
    }

    // Only suggest if it appears in at least 30% of orders with the target item
    const threshold = Math.ceil(totalOccurrences * 0.3);
    if (maxCount < threshold || !suggestedItemName) {
      return NextResponse.json({ suggestedItem: null }, { status: 200 });
    }

    // Get the suggested item details
    const { data: menuItem, error: menuError } = await supabaseAdmin
      .from('menuItems')
      .select('name, price, category, imageUrl')
      .eq('businessId', businessId)
      .ilike('name', `%${suggestedItemName}%`)
      .limit(1)
      .maybeSingle();

    if (menuError || !menuItem) {
      return NextResponse.json({ suggestedItem: null }, { status: 200 });
    }

    return NextResponse.json(
      {
        suggestedItem: {
          name: menuItem.name,
          price: menuItem.price,
          category: menuItem.category,
          imageUrl: menuItem.imageUrl,
          confidence: Math.round((maxCount / totalOccurrences) * 100),
        },
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error('Error in upsell API:', error);
    return NextResponse.json({ message: 'Internal server error', details: error?.message }, { status: 500 });
  }
}



