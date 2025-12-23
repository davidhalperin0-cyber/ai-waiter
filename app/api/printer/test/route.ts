import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { businessId, testOrder } = body;

    if (!businessId) {
      return NextResponse.json({ message: 'businessId is required' }, { status: 400 });
    }

    // Get business printer config
    const { data: business, error: fetchError } = await supabaseAdmin
      .from('businesses')
      .select('printerConfig')
      .eq('businessId', businessId)
      .maybeSingle();

    if (fetchError || !business) {
      return NextResponse.json({ message: 'Business not found' }, { status: 404 });
    }

    const printerConfig = business.printerConfig as any;

    if (!printerConfig || !printerConfig.enabled) {
      return NextResponse.json({ message: 'Printer is not enabled' }, { status: 400 });
    }

    if (!printerConfig.endpoint) {
      return NextResponse.json({ message: 'Printer endpoint is not configured' }, { status: 400 });
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
  text += `מספר הזמנה: ${order.orderId}\n`;
  text += `שולחן: ${order.tableId}\n`;
  text += '---\n';
  order.items.forEach((item: any) => {
    text += `${item.name} x${item.quantity} - ₪${(item.price * item.quantity).toFixed(2)}\n`;
  });
  text += '---\n';
  text += `סה"כ: ₪${order.totalAmount.toFixed(2)}\n`;
  text += '==========\n';
  return text;
}

function formatOrderAsXML(order: any): string {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<order>\n';
  xml += `  <orderId>${order.orderId}</orderId>\n`;
  xml += `  <tableId>${order.tableId}</tableId>\n`;
  xml += '  <items>\n';
  order.items.forEach((item: any) => {
    xml += '    <item>\n';
    xml += `      <name>${item.name}</name>\n`;
    xml += `      <quantity>${item.quantity}</quantity>\n`;
    xml += `      <price>${item.price}</price>\n`;
    xml += '    </item>\n';
  });
  xml += '  </items>\n';
  xml += `  <totalAmount>${order.totalAmount}</totalAmount>\n`;
  xml += '</order>\n';
  return xml;
}
