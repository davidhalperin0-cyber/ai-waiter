import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { businessId, printerConfig } = body;

    if (!businessId) {
      return NextResponse.json({ message: 'businessId is required' }, { status: 400 });
    }

    // Update printerConfig in businesses table
    // Note: If printerConfig column doesn't exist, you'll need to add it to the schema
    const { error } = await supabaseAdmin
      .from('businesses')
      .update({ printerConfig })
      .eq('businessId', businessId);

    if (error) {
      console.error('Error updating printer config', error);
      return NextResponse.json({ message: 'Database error' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Printer config updated successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error updating printer config', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
