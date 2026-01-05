import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { businessId, printerConfig } = body;

    if (!businessId) {
      return NextResponse.json({ message: 'businessId is required' }, { status: 400 });
    }

    if (!printerConfig || typeof printerConfig !== 'object') {
      return NextResponse.json({ message: 'printerConfig is required and must be an object' }, { status: 400 });
    }

    // Validate printerConfig structure
    const validConfig = {
      enabled: Boolean(printerConfig.enabled),
      type: printerConfig.type || 'http',
      endpoint: printerConfig.endpoint || '',
      payloadType: printerConfig.payloadType || 'json',
      port: printerConfig.port ? Number(printerConfig.port) : undefined,
      headers: printerConfig.headers || {},
    };

    // Update printerConfig in businesses table and return the updated value
    const { data, error } = await supabaseAdmin
      .from('businesses')
      .update({ printerConfig: validConfig })
      .eq('businessId', businessId)
      .select('printerConfig')
      .single();

    if (error) {
      console.error('Error updating printer config', error);
      return NextResponse.json({ 
        message: 'Database error', 
        details: error.message 
      }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ message: 'Business not found' }, { status: 404 });
    }

    // Return the updated config to confirm it was saved
    return NextResponse.json({ 
      message: 'Printer config updated successfully',
      printerConfig: data.printerConfig 
    }, { status: 200 });
  } catch (error: any) {
    console.error('Error updating printer config', error);
    return NextResponse.json({ 
      message: 'Internal server error',
      details: error?.message 
    }, { status: 500 });
  }
}
