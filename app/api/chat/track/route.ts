export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

// POST /api/chat/track
// Track when someone enters the chat
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { businessId, tableId } = body as {
      businessId: string;
      tableId: string;
    };

    if (!businessId || !tableId) {
      return NextResponse.json({ message: 'businessId and tableId are required' }, { status: 400 });
    }

    // Check if there's already an interaction for this business/table today
    // If yes, just update entered_chat_at. If no, create new record.
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: existing } = await supabaseAdmin
      .from('chat_interactions')
      .select('id')
      .eq('business_id', businessId)
      .eq('table_id', tableId)
      .gte('created_at', today.toISOString())
      .limit(1)
      .single();

    if (existing) {
      // Update existing record
      const { error } = await supabaseAdmin
        .from('chat_interactions')
        .update({
          entered_chat_at: new Date().toISOString(),
        })
        .eq('id', existing.id);

      if (error) {
        console.error('Error updating chat interaction:', error);
        return NextResponse.json({ message: 'Failed to track chat entry' }, { status: 500 });
      }
    } else {
      // Create new record
      const { error } = await supabaseAdmin
        .from('chat_interactions')
        .insert({
          business_id: businessId,
          table_id: tableId,
          entered_chat_at: new Date().toISOString(),
        });

      if (error) {
        console.error('Error tracking chat entry:', error);
        return NextResponse.json({ message: 'Failed to track chat entry' }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error in track chat endpoint:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

