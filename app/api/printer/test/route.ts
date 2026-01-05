import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { businessId, testOrder, printerConfig: providedPrinterConfig } = body;

    if (!businessId) {
      return NextResponse.json({ message: 'businessId is required' }, { status: 400 });
    }

    if (!testOrder) {
      return NextResponse.json({ message: 'testOrder is required' }, { status: 400 });
    }

    if (!testOrder.items || !Array.isArray(testOrder.items) || testOrder.items.length === 0) {
      return NextResponse.json({ message: 'testOrder.items must be a non-empty array' }, { status: 400 });
    }

    // Use provided printerConfig from frontend (to bypass read replica lag) or fetch from DB
    let printerConfig: any = providedPrinterConfig;

    if (!printerConfig) {
      // Fallback: Get business printer config from DB if not provided
      const { data: business, error: fetchError } = await supabaseAdmin
        .from('businesses')
        .select('printerConfig')
        .eq('businessId', businessId)
        .maybeSingle();

      if (fetchError) {
        console.error('Error fetching business printer config:', fetchError);
        return NextResponse.json({ 
          message: 'Database error', 
          details: fetchError.message 
        }, { status: 500 });
      }

      if (!business) {
        return NextResponse.json({ message: 'Business not found' }, { status: 404 });
      }

      printerConfig = business.printerConfig as any;
    }

    console.log('Printer config (provided or from DB):', {
      businessId,
      provided: !!providedPrinterConfig,
      hasPrinterConfig: !!printerConfig,
      enabled: printerConfig?.enabled,
      type: printerConfig?.type,
      endpoint: printerConfig?.endpoint,
      payloadType: printerConfig?.payloadType,
    });

    if (!printerConfig) {
      return NextResponse.json({ 
        message: 'Printer configuration not found. Please save printer settings first.' 
      }, { status: 400 });
    }

    if (!printerConfig.enabled) {
      return NextResponse.json({ 
        message: 'Printer is not enabled. Please enable it in settings and save before testing.' 
      }, { status: 400 });
    }

    if (!printerConfig.endpoint || printerConfig.endpoint.trim() === '') {
      return NextResponse.json({ 
        message: 'Printer endpoint is not configured. Please set an IP address or URL and save before testing.' 
      }, { status: 400 });
    }

    // Try to send test order to printer
    try {
      let response;
      const payload = printerConfig.payloadType === 'text'
        ? formatOrderAsText(testOrder)
        : printerConfig.payloadType === 'xml'
        ? formatOrderAsXML(testOrder)
        : JSON.stringify(testOrder, null, 2);

      if (printerConfig.type === 'http' || printerConfig.type === 'https') {
        const url = printerConfig.endpoint.startsWith('http')
          ? printerConfig.endpoint
          : `http://${printerConfig.endpoint}`;
        
        response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type':
              printerConfig.payloadType === 'json'
                ? 'application/json'
                : printerConfig.payloadType === 'xml'
                ? 'application/xml'
                : 'text/plain',
            ...(printerConfig.headers || {}),
          },
          body: payload,
        });
      } else {
        // For TCP/IP or Serial, we would need a different approach
        // This is a simplified version - in production you'd use a library like 'net' or 'serialport'
        return NextResponse.json(
          { message: 'TCP/IP and Serial connections require server-side implementation' },
          { status: 501 },
        );
      }

      if (response.ok) {
        return NextResponse.json({ message: 'Test print successful' }, { status: 200 });
      } else {
        return NextResponse.json(
          { message: `Printer returned error: ${response.status} ${response.statusText}` },
          { status: 500 },
        );
      }
    } catch (err: any) {
      console.error('Error sending to printer', err);
      return NextResponse.json(
        { message: `Failed to connect to printer: ${err.message}` },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error('Error testing printer', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

function formatOrderAsText(order: any): string {
  let text = '=== הזמנה ===\n';
  text += `מספר הזמנה: ${order.orderId || 'N/A'}\n`;
  text += `שולחן: ${order.tableId || 'N/A'}\n`;
  text += '---\n';
  if (order.items && Array.isArray(order.items)) {
    order.items.forEach((item: any) => {
      const name = item.name || 'פריט ללא שם';
      const quantity = item.quantity || 1;
      const price = item.price || 0;
      text += `${name} x${quantity} - ₪${(price * quantity).toFixed(2)}\n`;
    });
  }
  text += '---\n';
  text += `סה"כ: ₪${(order.totalAmount || 0).toFixed(2)}\n`;
  text += '==========\n';
  return text;
}

function formatOrderAsXML(order: any): string {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<order>\n';
  xml += `  <orderId>${order.orderId || 'N/A'}</orderId>\n`;
  xml += `  <tableId>${order.tableId || 'N/A'}</tableId>\n`;
  xml += '  <items>\n';
  if (order.items && Array.isArray(order.items)) {
    order.items.forEach((item: any) => {
      xml += '    <item>\n';
      xml += `      <name>${(item.name || 'פריט ללא שם').replace(/[<>&"']/g, '')}</name>\n`;
      xml += `      <quantity>${item.quantity || 1}</quantity>\n`;
      xml += `      <price>${item.price || 0}</price>\n`;
      xml += '    </item>\n';
    });
  }
  xml += '  </items>\n';
  xml += `  <totalAmount>${order.totalAmount || 0}</totalAmount>\n`;
  xml += '</order>\n';
  return xml;
}
