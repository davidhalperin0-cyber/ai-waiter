export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { Order, PosConfig } from '@/lib/types';
import { randomUUID } from 'crypto';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { isSubscriptionActive, shouldAutoExpire, Subscription } from '@/lib/subscription';
import { getPosAdapter } from '@/lib/pos/adapters';
import { orderToCanonical } from '@/lib/pos/orderMapper';

function formatOrderAsText(order: Order): string {
  let text = '=== הזמנה ===\n';
  text += `מספר הזמנה: ${order.orderId.substring(0, 8)}\n`;
  text += `שולחן: ${order.tableId}\n`;
  text += `תאריך: ${new Date(order.createdAt).toLocaleString('he-IL')}\n\n`;
  text += 'פריטים:\n';
  order.items.forEach((item, index) => {
    text += `${index + 1}. ${item.name} x${item.quantity} - ₪${(item.price * item.quantity).toFixed(2)}`;
    if (item.customizations && item.customizations.length > 0) {
      text += `\n   הערות: ${item.customizations.join(', ')}`;
    }
    text += '\n';
  });
  text += `\nסה"כ: ₪${order.totalAmount.toFixed(2)}\n`;
  if (order.aiSummary) {
    text += `\nהערות: ${order.aiSummary}\n`;
  }
  text += '================\n';
  return text;
}

function formatOrderAsXML(order: Order): string {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<order>\n';
  xml += `  <orderId>${order.orderId}</orderId>\n`;
  xml += `  <tableId>${order.tableId}</tableId>\n`;
  xml += `  <createdAt>${order.createdAt}</createdAt>\n`;
  xml += `  <totalAmount>${order.totalAmount}</totalAmount>\n`;
  xml += '  <items>\n';
  order.items.forEach((item) => {
    xml += '    <item>\n';
    xml += `      <name>${item.name}</name>\n`;
    xml += `      <quantity>${item.quantity}</quantity>\n`;
    xml += `      <price>${item.price}</price>\n`;
    if (item.customizations && item.customizations.length > 0) {
      xml += '      <customizations>\n';
      item.customizations.forEach((customization) => {
        xml += `        <customization>${customization}</customization>\n`;
      });
      xml += '      </customizations>\n';
    }
    xml += '    </item>\n';
  });
  xml += '  </items>\n';
  if (order.aiSummary) {
    xml += `  <summary>${order.aiSummary}</summary>\n`;
  }
  xml += '</order>\n';
  return xml;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { businessId, tableId, items, aiSummary } = body as Partial<Order> & {
      items: Order['items'];
    };

    if (!businessId || !tableId || !items || !items.length) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    // Check business subscription status
    const { data: business, error: businessError } = await supabaseAdmin
      .from('businesses')
      .select('isEnabled, subscription')
      .eq('businessId', businessId)
      .maybeSingle();

    if (businessError || !business) {
      return NextResponse.json({ message: 'Business not found' }, { status: 404 });
    }

    if (!business.isEnabled) {
      return NextResponse.json({ message: 'Business is disabled' }, { status: 403 });
    }

    const subscription = business.subscription as Subscription;
    
    // Check if planType is menu_only - block orders
    if (subscription.planType === 'menu_only') {
      return NextResponse.json(
        { message: 'Orders are not available in menu-only plan. Please upgrade to full plan.' },
        { status: 403 },
      );
    }
    
    // Auto-expire safety net: if status is "active" but nextBillingDate is in the past
    if (shouldAutoExpire(subscription)) {
      // Update subscription to expired
      await supabaseAdmin
        .from('businesses')
        .update({
          subscription: {
            ...subscription,
            status: 'expired',
          },
        })
        .eq('businessId', businessId);
      
      console.log(`Auto-expired subscription for business ${businessId} - nextBillingDate passed`);
      
      return NextResponse.json(
        { message: 'Subscription expired' },
        { status: 403 },
      );
    }

    // Validate subscription is active
    if (!isSubscriptionActive(subscription)) {
      return NextResponse.json(
        { message: 'Subscription expired' },
        { status: 403 },
      );
    }

    const totalAmount = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );

    const order: Order = {
      orderId: randomUUID(),
      businessId,
      tableId,
      items,
      aiSummary,
      status: 'received',
      createdAt: new Date().toISOString(),
      totalAmount,
    };

    const { error: insertError } = await supabaseAdmin
      .from('orders')
      .insert(order);

    if (insertError) {
      console.error('Order insert error', insertError);
      return NextResponse.json({ message: 'Database error' }, { status: 500 });
    }

    // Track status results for both printer and POS
    // Status hierarchy: sent_to_pos > sent_to_printer > received
    // Errors: pos_error > printer_error > received
    let printerStatus: 'sent_to_printer' | 'printer_error' | null = null;
    let posStatus: 'sent_to_pos' | 'pos_error' | null = null;

    // Send to printer/BON using business printer config
    try {
      const { data: businessWithPrinter, error: printerConfigError } = await supabaseAdmin
        .from('businesses')
        .select('printerConfig')
        .eq('businessId', businessId)
        .maybeSingle();

      if (!printerConfigError && businessWithPrinter?.printerConfig) {
        const printerConfig = businessWithPrinter.printerConfig as any;
        
        if (printerConfig.enabled && printerConfig.endpoint) {
          // Format order payload based on printer config
          let payload: string;
          if (printerConfig.payloadType === 'text') {
            payload = formatOrderAsText(order);
          } else if (printerConfig.payloadType === 'xml') {
            payload = formatOrderAsXML(order);
          } else {
            payload = JSON.stringify(order, null, 2);
          }

          // Send to printer
          if (printerConfig.type === 'http' || printerConfig.type === 'https') {
            const url = printerConfig.endpoint.startsWith('http')
              ? printerConfig.endpoint
              : `http://${printerConfig.endpoint}`;
            
            const response = await fetch(url, {
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

            if (response.ok) {
              printerStatus = 'sent_to_printer';
              console.log(`Order ${order.orderId} sent to printer successfully`);
            } else {
              printerStatus = 'printer_error';
              console.error(`Printer returned error for order ${order.orderId}: ${response.status} ${response.statusText}`);
            }
          } else {
            // TCP/IP or Serial - would need additional implementation
            console.warn(`Printer type ${printerConfig.type} not fully implemented for automatic sending`);
          }
        }
      }
    } catch (printerError) {
      // Log error but don't fail the order creation
      console.error('Error sending order to printer:', printerError);
      printerStatus = 'printer_error';
    }

    // Send to POS using adapter system
    try {
      const { data: businessWithPos, error: posConfigError } = await supabaseAdmin
        .from('businesses')
        .select('posConfig')
        .eq('businessId', businessId)
        .maybeSingle();

      if (!posConfigError && businessWithPos?.posConfig) {
        const posConfig = businessWithPos.posConfig as PosConfig;
        
        if (posConfig.enabled && posConfig.endpoint) {
          try {
            // Convert DB order to canonical format
            const canonicalOrder = orderToCanonical(order, aiSummary ? 'AI' : 'QR_MENU');
            
            // Resolve adapter based on provider
            const adapter = getPosAdapter(posConfig.provider);
            
            // Send order via adapter
            await adapter.sendOrder(canonicalOrder, posConfig);
            
            posStatus = 'sent_to_pos';
            console.log(`Order ${order.orderId} sent to POS successfully via ${posConfig.provider || 'generic'} adapter`);
          } catch (adapterError: any) {
            posStatus = 'pos_error';
            
            // Improved error logging with structured context
            const sanitizedEndpoint = posConfig.endpoint.replace(/\/\/.*@/, '//***@');
            console.error('POS adapter error', {
              orderId: order.orderId,
              provider: posConfig.provider || 'generic',
              endpoint: sanitizedEndpoint,
              error: adapterError.message,
            });
          }
        }
      }
    } catch (posError) {
      // Log error but don't fail the order creation
      console.error('Error sending order to POS:', posError);
      posStatus = 'pos_error';
    }

    // Determine final status based on hierarchy:
    // Priority: sent_to_pos > sent_to_printer > received
    // Errors: pos_error > printer_error > received
    // Successful statuses take precedence over errors
    let finalStatus: Order['status'] = 'received';
    if (posStatus === 'sent_to_pos') {
      finalStatus = 'sent_to_pos';
    } else if (printerStatus === 'sent_to_printer') {
      finalStatus = 'sent_to_printer';
    } else if (posStatus === 'pos_error') {
      finalStatus = 'pos_error';
    } else if (printerStatus === 'printer_error') {
      finalStatus = 'printer_error';
    }

    // Update order status once with the final status
    if (finalStatus !== 'received') {
      await supabaseAdmin
        .from('orders')
        .update({ status: finalStatus })
        .eq('orderId', order.orderId);
    }

    return NextResponse.json({ orderId: order.orderId }, { status: 200 });
  } catch (error) {
    console.error('Order creation error', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

