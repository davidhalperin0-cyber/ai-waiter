export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

// POST /api/scans/track
// Track a QR/NFC scan
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { businessId, tableId, source, deviceType, userAgent, referer } = body as {
      businessId: string;
      tableId: string;
      source?: 'qr' | 'nfc' | 'direct_link';
      deviceType?: string;
      userAgent?: string;
      referer?: string;
    };

    if (!businessId || !tableId) {
      return NextResponse.json({ message: 'businessId and tableId are required' }, { status: 400 });
    }

    // Insert scan record
    const { error } = await supabaseAdmin
      .from('qr_scans')
      .insert({
        business_id: businessId,
        table_id: tableId,
        source: source || 'qr',
        device_type: deviceType,
        user_agent: userAgent,
        referer: referer,
      });

    if (error) {
      console.error('Error tracking scan:', error);
      return NextResponse.json({ message: 'Failed to track scan' }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error in track scan endpoint:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

